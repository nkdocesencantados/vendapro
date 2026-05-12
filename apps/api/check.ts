import { DataSource } from "typeorm";
async function check() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const users = await ds.query('SELECT id, name, email, role, "storeId" FROM users LIMIT 5');
  console.log("USERS:", JSON.stringify(users, null, 2));
  const sales = await ds.query('SELECT id, "storeId", total FROM sales ORDER BY "createdAt" DESC LIMIT 3');
  console.log("SALES:", JSON.stringify(sales, null, 2));
  await ds.destroy();
}
check().catch(console.error);