import { DataSource } from "typeorm";
async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`UPDATE stores SET name = 'NK Doces Encantados', "primaryColor" = '#f97316' WHERE id = '0cdd3013-d7e6-4290-af6b-bc22d34fea7c'`);
  const r = await ds.query(`SELECT id, name, "primaryColor" FROM stores`);
  console.log("Atualizado:", JSON.stringify(r));
  await ds.destroy();
}
seed().catch(console.error);