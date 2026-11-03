ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "remote_access_password_enc" TEXT;
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "assigned_user_id" TEXT;
