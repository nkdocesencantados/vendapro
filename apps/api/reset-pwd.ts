import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
async function reset() {
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const hash = await bcrypt.hash("VendaPro@2026!", 12);
  await ds.query(`UPDATE users SET password = '${hash}' WHERE email = 'admin@vendapro.com.br'`);
  console.log("Senha resetada com sucesso!");
  await ds.destroy();
}
reset().catch(e => console.error(e.message));