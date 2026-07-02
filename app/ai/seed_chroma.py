"""Indexes the two seed documents referenced by the prototype's diagnostic
answer (project/Datacon.dc.html:1327-1354) into ChromaDB, so the Diagnostic
agent's citation retrieval works out of the box against the seeded demo data
— matching Postgres/Prisma's seed.ts, which creates the DataSource rows but
has no actual file content to chunk (they're pre-existing "already indexed"
demo records, not freshly uploaded files).
"""
from app.rag.chunking import chunk_words
from app.rag.chroma_store import index_chunks

DOCS = [
    {
        "document_id": "doc-inc-2026-074",
        "title": "INC-2026-074 Billing incident",
        "filename": "INC-2026-074.pdf",
        "text": (
            "Incident report INC-2026-074: Billing invoice generation outage, EMEA region.\n\n"
            "Summary: On June 26, a deployment of the v4.2 billing service introduced a regression "
            "in VAT-inclusive invoice calculation for EMEA accounts.\n\n"
            "Invoice generation returned 500s for EMEA VAT accounts between 08:00-11:30 UTC. "
            "Customers attempting to view or download invoices during this window received "
            "server errors instead of PDF invoices, generating a wave of support tickets.\n\n"
            "Root cause: a null-pointer exception in the VAT surcharge calculator when the "
            "account's billing country code was set post-migration.\n\n"
            "Resolution: rolled back the v4.2 billing service at 11:30 UTC; a patched version "
            "with a regression test for VAT edge cases was deployed the following day."
        ),
    },
    {
        "document_id": "doc-support-sop",
        "title": "Support runbook",
        "filename": "support_sop.md",
        "text": (
            "# Support Runbook: Ticket Escalation Policy\n\n"
            "## Billing-class tickets\n"
            "Escalate billing-class tickets to Tier 2 within 30 minutes of detection. "
            "Billing tickets are considered high-priority because they directly affect "
            "customer trust and revenue recognition.\n\n"
            "## General escalation\n"
            "Tier 1 support should escalate any ticket volume spike exceeding 50% over the "
            "trailing 7-day average to the on-call engineering lead immediately."
        ),
    },
]


def main():
    for doc in DOCS:
        chunks = chunk_words(doc["text"])
        index_chunks(doc["document_id"], doc["title"], doc["filename"], chunks)
        print(f"Indexed {len(chunks)} chunk(s) for {doc['title']}")


if __name__ == "__main__":
    main()
