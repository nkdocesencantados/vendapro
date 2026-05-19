const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB = "postgresql://postgres:CIsiKNwXMxbFfqHEJxwlduxdwyRhapeH@viaduct.proxy.rlwy.net:10372/railway";
const BACKUP_DIR = path.join(__dirname, "backups");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });

async function backup() {
  console.log("Conectando ao banco...");
  await client.connect();
  
  const tables = ["companies","stores","users","products","sales","sale_items","financial_entries"];
  const date = new Date().toISOString().split("T")[0];
  let sql = `-- VendaPro Backup ${date}\n-- Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n`;
  let totalRegistros = 0;

  for (const table of tables) {
    try {
      const rows = await client.query(`SELECT * FROM ${table}`);
      sql += `-- =====================\n-- Tabela: ${table} (${rows.rows.length} registros)\n-- =====================\n`;
      if (rows.rows.length === 0) { sql += `-- vazio\n\n`; continue; }
      for (const row of rows.rows) {
        const cols = Object.keys(row).map(c => `"${c}"`).join(",");
        const vals = Object.values(row).map(v => {
          if (v === null) return "NULL";
          if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g,"''")}'`;
          return `'${String(v).replace(/'/g,"''")}'`;
        }).join(",");
        sql += `INSERT INTO ${table} (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
        totalRegistros++;
      }
      sql += "\n";
      console.log(`  ✅ ${table}: ${rows.rows.length} registros`);
    } catch(e) {
      sql += `-- Erro em ${table}: ${e.message}\n\n`;
      console.log(`  ⚠️  ${table}: erro - ${e.message}`);
    }
  }

  const file = path.join(BACKUP_DIR, `backup-${date}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  
  console.log("\n=============================");
  console.log(`✅ Backup concluido!`);
  console.log(`📁 Arquivo: ${file}`);
  console.log(`📊 Total de registros: ${totalRegistros}`);
  console.log(`💾 Tamanho: ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
  console.log("=============================");
  
  await client.end();
}

backup().catch(e => { console.error("Erro:", e.message); client.end(); });
