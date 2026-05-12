import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR`);
  await ds.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3)`);
  console.log("Colunas adicionadas!");
  await ds.destroy();
}
seed().catch(console.error);