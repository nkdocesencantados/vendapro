const { Client } = require("pg");
const client = new Client({
  connectionString: "postgresql://postgres:CIsiKNwXMxbFfqHEJxwlduxdwyRhapeH@viaduct.proxy.rlwy.net:10372/railway",
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  const r = await client.query('SELECT id, name, "primaryColor" FROM stores');
  console.log(JSON.stringify(r.rows, null, 2));
  client.end();
}).catch(e => console.error(e.message));
