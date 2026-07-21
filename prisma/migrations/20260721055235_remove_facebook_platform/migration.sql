-- Remove FACEBOOK from the Platform enum (no rows use it; verified before writing this migration).
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TIKTOK');
ALTER TABLE "PlatformAccount" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TABLE "PlatformTarget" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "Platform_old";
COMMIT;
