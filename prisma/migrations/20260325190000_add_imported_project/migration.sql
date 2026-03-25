-- CreateTable
CREATE TABLE "ImportedProject" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceProjectId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "sourceStatus" TEXT,
    "iconUrl" TEXT,
    "twitterUrl" TEXT,
    "tokenAddress" TEXT,
    "upvotes" INTEGER,
    "downvotes" INTEGER,
    "sourceCreatedAt" TIMESTAMP(3),
    "twitterUserId" TEXT,
    "twitterUsername" TEXT,
    "twitterName" TEXT,
    "twitterProfileImage" TEXT,
    "twitterVerified" BOOLEAN,
    "rawListPayload" JSONB,
    "rawDetailPayload" JSONB,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportedProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportedProject_source_sourceProjectId_key" ON "ImportedProject"("source", "sourceProjectId");

-- CreateIndex
CREATE INDEX "ImportedProject_source_lastSyncedAt_idx" ON "ImportedProject"("source", "lastSyncedAt");
