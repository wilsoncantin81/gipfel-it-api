-- CreateTable
CREATE TABLE IF NOT EXISTS "client_notes" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "client_note_files" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "client_id" TEXT,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_note_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_notes" ADD CONSTRAINT IF NOT EXISTS "client_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_note_files" ADD CONSTRAINT IF NOT EXISTS "client_note_files_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "client_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
