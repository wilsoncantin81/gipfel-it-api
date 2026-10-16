-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'otro',
    "title" TEXT NOT NULL,
    "tech_id" TEXT,
    "tech_name" TEXT,
    "ticket_id" TEXT,
    "ticket_num" TEXT,
    "ticket_label" TEXT,
    "time_start" TEXT,
    "time_end" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
