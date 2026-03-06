require("dotenv").config();
const { Pool } = require("pg");

// PostgreSQL connection via Supabase Connection Pooler
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Test connection
pool.connect()
    .then(conn => {
        console.log("✓ Connecté à Supabase PostgreSQL");
        console.log("  Host:", process.env.DB_HOST, "Port:", process.env.DB_PORT);
        conn.release();
    })
    .catch(err => {
        console.error("✗ Erreur connexion DB:", err.message);
        console.error("  Code:", err.code);
        console.error("  Port configuré:", process.env.DB_PORT);
        if (err.code === 'ENOTFOUND') {
            console.error("  → Le domaine Supabase ne peut pas être résolu.");
        } else if (err.message.includes('Tenant or user not found')) {
            console.error("  → Vérifiez le nom d'utilisateur et le port (doit être 6543 pour Transaction Mode)");
        }
    });

// Handle pool errors
pool.on('error', (err) => {
    console.error('Erreur inattendue dans la pool:', err);
});

// Wrapper pour compatibilité avec code existant mysql2
class ConnectionWrapper {
    constructor(pgPool) {
        this.pgPool = pgPool;
    }

    /**
     * Query exécutant du code PostgreSQL
     * Convertit les paramètres de ? à $1, $2, etc.
     * Retourne [rows, fields] pour compatibilité mysql2
     */
    async query(sql, params = []) {
        try {
            // Convertir les paramètres de ? vers $1, $2, etc.
            let convertedSql = sql;
            let paramIndex = 1;
            convertedSql = convertedSql.replace(/\?/g, () => `$${paramIndex++}`);

            const result = await this.pgPool.query(convertedSql, params);
            // Retourner au format mysql2 pour compatibilité
            return [result.rows, result.fields];
        } catch (error) {
            throw error;
        }
    }
}

// Wrapper pour compatibilité avec interface getConnection()
const poolWrapper = {
    async getConnection() {
        // Pour PostgreSQL, on retourne juste un wrapper compatible
        // Pas de gestion de connexion explicite comme mysql2
        return new ConnectionWrapper(pool);
    },
    async query(sql, params) {
        const conn = new ConnectionWrapper(pool);
        return conn.query(sql, params);
    }
};

module.exports = poolWrapper;