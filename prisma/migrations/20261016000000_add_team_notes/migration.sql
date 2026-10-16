-- CreateTable
CREATE TABLE "team_notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "converted_to_ticket" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "team_notes" ADD CONSTRAINT "team_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
