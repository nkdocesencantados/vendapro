const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:CIsiKNwXMxbFfqHEJxwlduxdwyRhapeH@viaduct.proxy.rlwy.net:10372/railway',
  ssl: { rejectUnauthorized: false }
});
ds.initialize().then(async () => {
  const companies = await ds.query('SELECT id, name FROM companies');
  console.log('COMPANIES:', JSON.stringify(companies));
  const fks = await ds.query("SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'companies'");
  console.log('FK para companies:', JSON.stringify(fks));
  ds.destroy();
}).catch(e => console.error('ERRO:', e.message));
