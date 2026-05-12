import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const alters = [
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR DEFAULT 'un'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrl" VARCHAR`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes VARCHAR`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN DEFAULT false`,
    `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN DEFAULT true`,
    `ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS "productName" VARCHAR`,
    `ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP`,
    `ALTER TABLE financial_entries ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP`,
  ];
  for (const sql of alters) {
    try { await ds.query(sql); console.log("OK: " + sql.substring(0,50)) } catch(e: any) { console.log("SKIP: " + e.message.substring(0,50)) }
  }
  console.log("Concluido!");
  await ds.destroy();
}
seed().catch(console.error);