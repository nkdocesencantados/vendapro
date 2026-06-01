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

  // Garantir que o super admin existe
  const bcrypt = require('bcrypt');
  const existingAdmin = await dataSource.query(
    `SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`
  );
  if (!existingAdmin || existingAdmin.length === 0) {
    const hash = await bcrypt.hash('VendaPro@Admin2026!', 10);
    await dataSource.query(
      `INSERT INTO users (id, name, email, password, role, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Super Admin', 'admin@vendapro.com.br', $1, 'super_admin', 'active', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET role = 'super_admin', status = 'active'`,
      [hash]
    );
    console.log('Super Admin criado: admin@vendapro.com.br / VendaPro@Admin2026!');
  } else {
    console.log('Super Admin ja existe.');
  }
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
