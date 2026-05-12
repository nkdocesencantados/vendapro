import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const stores = await ds.query(`SELECT id FROM stores LIMIT 1`);
  let storeId;
  if (!stores.length) {
    const r = await ds.query(`INSERT INTO stores (name, description) VALUES ('Loja Principal', 'Loja padrao') RETURNING id`);
    storeId = r[0].id;
    console.log('Loja criada:', storeId);
  } else {
    storeId = stores[0].id;
    console.log('Loja existente:', storeId);
  }
  await ds.query(`UPDATE users SET "storeId" = $1 WHERE "storeId" IS NULL`, [storeId]);
  console.log('Usuarios atualizados!');
  await ds.destroy();
}
seed().catch(console.error);