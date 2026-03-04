-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RacquetModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    CONSTRAINT "RacquetModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stringer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME
);

-- CreateTable
CREATE TABLE "ServiceJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trackingUUID" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "modelId" INTEGER,
    "customRacquetInfo" TEXT,
    "stringMain" TEXT,
    "stringCross" TEXT,
    "mainsTensionLbs" DECIMAL,
    "crossTensionLbs" DECIMAL,
    "racquetCount" INTEGER NOT NULL DEFAULT 1,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Waiting',
    "stringerId" INTEGER,
    "dueDate" DATETIME NOT NULL,
    "scheduledDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceJob_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "RacquetModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServiceJob_stringerId_fkey" FOREIGN KEY ("stringerId") REFERENCES "Stringer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RacquetModel_name_manufacturerId_key" ON "RacquetModel"("name", "manufacturerId");

-- CreateIndex
CREATE UNIQUE INDEX "Stringer_name_key" ON "Stringer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceJob_trackingUUID_key" ON "ServiceJob"("trackingUUID");
