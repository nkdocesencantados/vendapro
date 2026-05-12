import { DataSource } from "typeorm";
async function fix() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const result = await ds.query(`UPDATE sales SET "storeId" = '0cdd3013-d7e6-4290-af6b-bc22d34fea7c' WHERE "storeId" IS NULL`);
  console.log("Vendas corrigidas:", result);
  const result2 = await ds.query(`UPDATE financial_entries SET "storeId" = '0cdd3013-d7e6-4290-af6b-bc22d34fea7c' WHERE "storeId" IS NULL`);
  console.log("Financeiro corrigido:", result2);
  await ds.destroy();
}
fix().catch(console.error);