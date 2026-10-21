-- CreateTable
CREATE TABLE IF NOT EXISTS "payable_invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "type" TEXT NOT NULL DEFAULT 'factura',
    "supplier" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoice_date" TEXT NOT NULL,
    "due_date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "paid_at" TEXT,
    "paid_amount" DOUBLE PRECISION,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payable_invoices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payable_invoices" ADD CONSTRAINT IF NOT EXISTS "payable_invoices_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
