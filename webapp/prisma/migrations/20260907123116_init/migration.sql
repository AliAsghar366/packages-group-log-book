-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "vendorId" TEXT,
    "issueType" TEXT,
    "downtimeMinutes" REAL,
    "stopsCount" INTEGER,
    "machineId" TEXT,
    "status" TEXT,
    "startTime" DATETIME,
    "tempFixedTime" DATETIME,
    "resolvedTime" DATETIME,
    "immediateAction" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "resultsSummary" TEXT,
    "description" TEXT,
    "preparedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LogEntry_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LogEntry_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssuanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "vendorId" TEXT NOT NULL,
    "description" TEXT,
    "netQty" REAL NOT NULL,
    "deckle" INTEGER,
    "paperType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssuanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_name_key" ON "Machine"("name");

-- CreateIndex
CREATE INDEX "LogEntry_category_date_idx" ON "LogEntry"("category", "date");

-- CreateIndex
CREATE INDEX "LogEntry_vendorId_idx" ON "LogEntry"("vendorId");

-- CreateIndex
CREATE INDEX "LogEntry_machineId_idx" ON "LogEntry"("machineId");

-- CreateIndex
CREATE INDEX "IssuanceRecord_vendorId_date_idx" ON "IssuanceRecord"("vendorId", "date");
