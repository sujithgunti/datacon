import { BadRequestException, Injectable } from "@nestjs/common";
import { DocType } from "@datacon/prisma";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AiClientService } from "../common/ai-client.service";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB, per PRD FR-3.1
const EXT_TO_TYPE: Record<string, DocType> = { pdf: "PDF", csv: "CSV", txt: "TXT", md: "MD" };
const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClientService,
  ) {}

  private shape(row: any) {
    return {
      id: row.id,
      title: row.title,
      filename: row.filename,
      type: row.type,
      status: row.status,
      sizeBytes: row.sizeBytes,
      chunkCount: row.chunkCount,
      rowCount: row.rowCount,
      colCount: row.colCount,
      failureMsg: row.failureMsg,
      uploadedBy: row.uploadedBy?.email,
      createdAt: row.createdAt,
    };
  }

  async list() {
    const rows = await this.prisma.dataSource.findMany({
      include: { uploadedBy: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.shape(r));
  }

  async upload(file: Express.Multer.File, uploadedById: string) {
    if (!file) throw new BadRequestException("No file was uploaded.");

    const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
    const docType = EXT_TO_TYPE[ext];
    if (!docType) {
      throw new BadRequestException(
        `.${ext} files aren't supported yet. Datacon ingests PDF, CSV, TXT and MD — export the sheet as CSV and try again.`,
      );
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `${file.originalname} is ${mb} MB — that exceeds the 10 MB per-file limit. Split the export or compress it before uploading.`,
      );
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const storageKey = `${randomUUID()}.${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storageKey);
    fs.writeFileSync(storagePath, file.buffer);

    const title = path.basename(file.originalname, path.extname(file.originalname));
    const row = await this.prisma.dataSource.create({
      data: {
        title,
        filename: file.originalname,
        type: docType,
        status: docType === "CSV" ? "INDEXING" : "CHUNKING",
        sizeBytes: file.size,
        storageKey,
        uploadedById,
      },
    });

    try {
      const res = await this.ai.client.post("/internal/documents/ingest", {
        documentId: row.id,
        title,
        filename: file.originalname,
        storagePath,
        docType: docType.toLowerCase(),
      });
      const data = res.data as { ok: boolean; message: string; chunkCount?: number; rowCount?: number; colCount?: number };
      const updated = await this.prisma.dataSource.update({
        where: { id: row.id },
        data: {
          status: "INDEXED",
          chunkCount: data.chunkCount ?? null,
          rowCount: data.rowCount ?? null,
          colCount: data.colCount ?? null,
        },
        include: { uploadedBy: { select: { email: true } } },
      });
      return this.shape(updated);
    } catch (e: any) {
      const failureMsg = e?.response?.data?.detail ?? e?.message ?? "Indexing failed.";
      const updated = await this.prisma.dataSource.update({
        where: { id: row.id },
        data: { status: "FAILED", failureMsg },
        include: { uploadedBy: { select: { email: true } } },
      });
      return this.shape(updated);
    }
  }
}
