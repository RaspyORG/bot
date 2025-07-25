const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optionally, add ssl: { rejectUnauthorized: false } for some hosts
});

// Get config for a guild
async function getGuildConfig(guildId) {
  const { rows } = await pool.query(
    "SELECT * FROM guild_config WHERE guild_id = $1",
    [guildId]
  );
  return rows[0] || null;
}

// Set config for a guild
async function setGuildConfig(guildId, config) {
  const keys = Object.keys(config);
  const values = Object.values(config);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await pool.query(
    `INSERT INTO guild_config (guild_id, ${keys.join(", ")}) VALUES ($1, ${keys
      .map((_, i) => `$${i + 2}`)
      .join(", ")})
     ON CONFLICT (guild_id) DO UPDATE SET ${setClause}`,
    [guildId, ...values]
  );
}

module.exports = pool;
module.exports.getGuildConfig = getGuildConfig;
module.exports.setGuildConfig = setGuildConfig;
