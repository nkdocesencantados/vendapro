const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:CIsiKNwXMxbFfqHEJxwlduxdwyRhapeH@viaduct.proxy.rlwy.net:10372/railway',
  ssl: { rejectUnauthorized: false }
});
ds.initialize().then(async () => {
  const cols = await ds.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('stores','users') ORDER BY table_name, column_name");
  console.log(JSON.stringify(cols, null, 2));
  ds.destroy();
}).catch(e => console.error('ERRO:', e.message));
