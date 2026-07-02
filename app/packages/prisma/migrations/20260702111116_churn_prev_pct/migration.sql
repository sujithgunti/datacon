/*
  Warnings:

  - Added the required column `prevChurnPct` to the `churn_snapshot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "churn_snapshot" ADD COLUMN     "prevChurnPct" DOUBLE PRECISION NOT NULL;
