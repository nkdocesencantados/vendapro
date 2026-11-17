-- VendaPro: clientes, fiado (contas a receber), metas e PIX da loja
-- Idempotente: pode rodar mais de uma vez. Postgres.
-- Rode o ALTER TYPE isolado (fora de transação) se seu Postgres for < 12.

ALTER TYPE sales_paymentmethod_enum ADD VALUE IF NOT EXISTS 'fiado';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vendas: campos de fiado
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "customerId" uuid;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "dueDate" date;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "paidAmount" numeric(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS "paidAt" timestamp;
-- vendas antigas (todas à vista) ficam quitadas
UPDATE sales SET "paidAmount" = total WHERE "paymentMethod"::text <> 'fiado' AND ("paidAmount" IS NULL OR "paidAmount" = 0);
CREATE INDEX IF NOT EXISTS "IDX_sales_store_customer" ON sales ("storeId", "customerId");

-- Clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "storeId" varchar NOT NULL,
  name varchar(150) NOT NULL,
  phone varchar(30),
  email varchar(150),
  document varchar(20),
  notes text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_customers_storeId" ON customers ("storeId");

-- Metas mensais
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "storeId" varchar NOT NULL,
  month varchar(7) NOT NULL,
  target numeric(12,2) NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_goals_store_month" UNIQUE ("storeId", month)
);

-- PIX da loja
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "pixKey" varchar(140);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "pixKeyType" varchar(10);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "pixMerchantName" varchar(25);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "pixCity" varchar(15);
