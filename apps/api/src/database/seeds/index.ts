import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3)`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,2) DEFAULT 0`);
  console.log("OK!");
  await ds.destroy();
}
seed().catch(console.error);