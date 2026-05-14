import { DataSource } from "typeorm";
async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR DEFAULT '#1D9E75'`);
  await ds.query(`UPDATE stores SET "primaryColor" = '#1D9E75' WHERE "primaryColor" IS NULL`);
  const stores = await ds.query(`SELECT id, name FROM stores LIMIT 3`);
  console.log("Stores:", JSON.stringify(stores));
  await ds.destroy();
}
seed().catch(console.error);