-- Drop everything from previous schema (idempotent)
DROP TABLE IF EXISTS "Swipe" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Project" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "Direction" CASCADE;
DROP TYPE IF EXISTS "Stage" CASCADE;
DROP TYPE IF EXISTS "PitchStatus" CASCADE;
DROP TYPE IF EXISTS "SwipeDirection" CASCADE;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "twitterUrl" TEXT,
    "websiteUrl" TEXT,
    "tokenMint" TEXT,
    "builderName" TEXT NOT NULL,
    "builderAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
