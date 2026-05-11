import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";

async function seed() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"avatarUrl\" VARCHAR");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"storeId\" UUID");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"lastLoginAt\" TIMESTAMP");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"resetPasswordToken\" VARCHAR");
  await ds.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS \"resetPasswordExpires\" TIMESTAMP");
  console.log("Colunas adicionadas!");
  await ds.destroy();
}
seed().catch(console.error);