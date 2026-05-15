const { Client } = require("pg");
const client = new Client({
  connectionString: "postgresql://postgres:CIsiKNwXMxbFfqHEJxwlduxdwyRhapeH@viaduct.proxy.rlwy.net:10372/railway",
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async () => {
  await client.query('UPDATE stores SET name = $1, "primaryColor" = $2 WHERE id = $3', ["Nubia linda", "#ec4899", "3b8d0ac0-032f-4136-8412-22374e4b60f1"]);
  console.log("Store atualizada!");
  client.end();
}).catch(e => console.error(e.message));
