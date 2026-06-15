import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function runMigrations(dataSource: DataSource) {
  // Adiciona coluna saleDate se não existir
  await dataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sales' AND column_name='saleDate'
      ) THEN
        ALTER TABLE sales ADD COLUMN "saleDate" TIMESTAMP;
        UPDATE sales SET "saleDate" = "createdAt";
      END IF;
    END $$;
  `);
  console.log('Migration saleDate: OK');

  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='profitMargin') THEN ALTER TABLE stores ADD COLUMN "profitMargin" DECIMAL(5,2) DEFAULT 26.30; END IF; END $$;`);
  console.log('Migration profitMargin: OK');

  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='margin') THEN ALTER TABLE stores ADD COLUMN margin DECIMAL(5,2) DEFAULT 26.30; END IF; END $$;`);
  console.log('Migration margin: OK');

  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='phone') THEN ALTER TABLE stores ADD COLUMN phone VARCHAR(30); END IF; END $$;`);
  console.log('Migration phone: OK');

  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='cnpj') THEN ALTER TABLE stores ADD COLUMN cnpj VARCHAR(30); END IF; END $$;`);
  console.log('Migration cnpj: OK');

  // Migrations para colunas da tabela stores que podem não existir
  const storeMigrations = [
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='status') THEN ALTER TABLE stores ADD COLUMN status VARCHAR(20) DEFAULT 'trial'; END IF; END $$;`, 'stores.status'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='segment') THEN ALTER TABLE stores ADD COLUMN segment VARCHAR(100); END IF; END $$;`, 'stores.segment'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='palette') THEN ALTER TABLE stores ADD COLUMN palette VARCHAR(50) DEFAULT 'emerald'; END IF; END $$;`, 'stores.palette'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='logoUrl') THEN ALTER TABLE stores ADD COLUMN "logoUrl" VARCHAR(255); END IF; END $$;`, 'stores.logoUrl'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='email') THEN ALTER TABLE stores ADD COLUMN email VARCHAR(150); END IF; END $$;`, 'stores.email'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='settings') THEN ALTER TABLE stores ADD COLUMN settings JSONB; END IF; END $$;`, 'stores.settings'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='defaultCommissionRate') THEN ALTER TABLE stores ADD COLUMN "defaultCommissionRate" DECIMAL(5,2) DEFAULT 15.00; END IF; END $$;`, 'stores.defaultCommissionRate'],
    [`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commissionRate') THEN ALTER TABLE users ADD COLUMN "commissionRate" DECIMAL(5,2) DEFAULT 0; END IF; END $$;`, 'users.commissionRate'],
  ];
  for (const [sql, name] of storeMigrations) {
    try { await dataSource.query(sql as string); console.log('Migration ' + name + ': OK'); }
    catch(e) { console.log('Migration ' + name + ': SKIP - ' + (e as any).message); }
  }

  // Migration commissionRate na tabela users
  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='commissionRate') THEN ALTER TABLE users ADD COLUMN "commissionRate" DECIMAL(5,2) DEFAULT 0; END IF; END $$;`);
  console.log('Migration commissionRate: OK');

  // Adicionar valor 'sale' ao enum de movimentos se não existir
  try {
    await dataSource.query(`ALTER TYPE stock_movements_type_enum ADD VALUE IF NOT EXISTS 'sale'`);
    console.log('Migration stock_movements sale enum: OK');
  } catch(e) { console.log('Migration stock_movements sale: SKIP - ' + (e as any).message); }

  // Corrigir status de todas as lojas com plano pago que estão como trial
  try {
    await dataSource.query(`
      UPDATE stores SET status = 'active'
      WHERE LOWER(plan) IN ('business', 'pro', 'starter', 'basic')
      AND (status IS NULL OR status = 'trial')
    `);
    console.log('Migration fix status lojas pagas: OK');
  } catch(e) { console.log('Migration fix status lojas pagas: SKIP - ' + (e as any).message); }

  // Migration defaultCommissionRate na tabela stores
  await dataSource.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='defaultCommissionRate') THEN ALTER TABLE stores ADD COLUMN "defaultCommissionRate" DECIMAL(5,2) DEFAULT 0; END IF; END $$;`);
  console.log('Migration defaultCommissionRate: OK');

  const existingAdmin = await dataSource.query(`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`);
  if (!existingAdmin || existingAdmin.length === 0) {
    await dataSource.query(`UPDATE users SET role = 'super_admin', status = 'active' WHERE email = 'admin@vendapro.com.br'`);
    console.log('Super Admin role atualizado');
  } else { console.log('Super Admin ja existe'); }

  // Garantir que o super admin existe

}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('VendaPro API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  // Roda migration antes de subir
  const dataSource = app.get(DataSource);
  await runMigrations(dataSource);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`VendaPro API rodando em: http://localhost:${port}`);
}
bootstrap();
