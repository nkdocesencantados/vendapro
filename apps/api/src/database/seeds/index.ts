import { DataSource } from "typeorm";
async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,2) DEFAULT 0`);
  await ds.query(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS "productName" VARCHAR(200)`);
  await ds.query(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS "isManual" BOOLEAN DEFAULT false`);
  await ds.query(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS "manualDescription" TEXT`);
  await ds.query(`DELETE FROM financial_entries WHERE "referenceId" IN (SELECT id FROM sales WHERE status = 'cancelled')`);
  console.log("OK!");
  await ds.destroy();
}
seed().catch(console.error);