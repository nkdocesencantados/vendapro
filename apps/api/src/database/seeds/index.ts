import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query("CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100), email VARCHAR(150) UNIQUE, password VARCHAR(255), role VARCHAR(50) DEFAULT 'seller', status VARCHAR(50) DEFAULT 'active', \"commissionRate\" DECIMAL(5,2) DEFAULT 15, \"createdAt\" TIMESTAMP DEFAULT NOW(), \"updatedAt\" TIMESTAMP DEFAULT NOW())");
  const exists = await ds.query("SELECT id FROM users WHERE email = $1", ["admin@vendapro.com.br"]);
  if (!exists || !exists.length) {
    const hash = await bcrypt.hash("VendaPro@2026!", 12);
    await ds.query("INSERT INTO users (name,email,password,role,status) VALUES ($1,$2,$3,$4,$5)", ["Super Admin", "admin@vendapro.com.br", hash, "super_admin", "active"]);
    console.log("Super Admin criado!");
  } else {
    console.log("Ja existe.");
  }
  await ds.destroy();
}
seed().catch(console.error);
