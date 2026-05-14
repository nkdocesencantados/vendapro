import { DataSource } from "typeorm";
async function check() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const users = await ds.query('SELECT id, name, email, role, status, "storeId" FROM users');
  console.log(JSON.stringify(users));
  await ds.destroy();
}
check().catch(e => console.error(e.message));