import { DataSource } from "typeorm";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query(`CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    document VARCHAR(20),
    plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'active',
    "trialEndsAt" TIMESTAMP,
    "subscriptionEndsAt" TIMESTAMP,
    "ownerId" UUID,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`);
  await ds.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS "companyId" UUID`);
  await ds.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "companyId" UUID`);
  console.log("Tabela companies criada!");
  await ds.destroy();
}
seed().catch(console.error);