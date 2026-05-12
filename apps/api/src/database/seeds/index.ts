import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const r = await ds.query(`SELECT id, status, total, "createdAt" FROM sales WHERE status = 'completed'`);
  console.log("Vendas concluidas:", r);
  await ds.destroy();
}
seed().catch(console.error);