-- CreateTable
CREATE TABLE "revenue_metrics" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "revenue_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_revenue" (
    "id" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "region_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_daily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "ticket_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_snapshot" (
    "id" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "churnPct" DOUBLE PRECISION NOT NULL,
    "atRiskAccounts" INTEGER NOT NULL,

    CONSTRAINT "churn_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_metrics_month_key" ON "revenue_metrics"("month");

-- CreateIndex
CREATE UNIQUE INDEX "region_revenue_quarter_region_key" ON "region_revenue"("quarter", "region");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_daily_date_region_key" ON "ticket_daily"("date", "region");
