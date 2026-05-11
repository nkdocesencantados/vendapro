import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
  });
  await ds.initialize();
  const repo = ds.getRepository('users');
  const exists = await repo.findOne({ where: { email: 'admin@vendapro.com.br' } });
  if (!exists) {
    await repo.save(repo.create({
      name: 'Super Admin',
      email: 'admin@vendapro.com.br',
      password: await bcrypt.hash('VendaPro@2026!', 12),
      role: 'super_admin',
      status: 'active',
    }));
    console.log('Super Admin criado: admin@vendapro.com.br / VendaPro@2026!');
  } else {
    console.log('Super Admin ja existe.');
  }
  await ds.destroy();
}
seed().catch(console.error);
