-- CreateEnum
CREATE TYPE "SavedTextKind" AS ENUM ('CAPTION', 'COMMENT');

-- AlterTable
ALTER TABLE "PlatformTarget" ADD COLUMN     "firstComment" TEXT,
ADD COLUMN     "firstCommentError" TEXT,
ADD COLUMN     "firstCommentPostedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SavedText" (
    "id" TEXT NOT NULL,
    "kind" "SavedTextKind" NOT NULL,
    "title" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedText_kind_idx" ON "SavedText"("kind");
