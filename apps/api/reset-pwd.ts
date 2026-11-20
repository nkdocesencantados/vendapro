import { DataSource } from "typeorm";
import * as bcrypt from "bcryptjs";
// uso: NEW_ADMIN_PASSWORD='...' npx ts-node reset-pwd.ts  (a senha nunca fica no código)
async function reset() {
  const pwd = process.env.NEW_ADMIN_PASSWORD;
  if (!pwd || pwd.length < 12) throw new Error("Defina NEW_ADMIN_PASSWORD (minimo 12 caracteres)");
  const ds = new DataSource({ type: "postgres", url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, entities: [], synchronize: false } as any);
  await ds.initialize();
  const hash = await bcrypt.hash(pwd, 12);
  await ds.query(`UPDATE users SET password = $1 WHERE email = 'admin@vendapro.com.br'`, [hash]);
  console.log("Senha resetada com sucesso!");
  await ds.destroy();
}
reset().catch(e => console.error(e.message));
