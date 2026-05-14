import { DataSource } from "typeorm";
async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const cols = await ds.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'stores' ORDER BY column_name`);
  console.log("Colunas stores:", cols.map((c:any) => c.column_name).join(", "));
  await ds.destroy();
}
seed().catch(console.error);