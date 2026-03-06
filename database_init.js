/**
 * Script d'Installation de la Base de Données
 * Crée toutes les tables nécessaires au projet Permis sur Supabase PostgreSQL
 * 
 * Utilisation: node database_init.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
        `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`,
    ssl: { rejectUnauthorized: false },
});

const CREATE_TABLES_SQL = `
-- 1. TABLE USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. TABLE ADMINS
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);

-- 3. TABLE SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code VARCHAR(5) NOT NULL,
    answers JSONB NOT NULL,
    correct_count INT NOT NULL,
    total_count INT NOT NULL DEFAULT 25,
    percentage INT NOT NULL,
    is_passed BOOLEAN GENERATED ALWAYS AS (percentage >= 80) STORED,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_code ON submissions(exam_code);
CREATE INDEX IF NOT EXISTS idx_submissions_percentage ON submissions(percentage);
CREATE INDEX IF NOT EXISTS idx_submissions_is_passed ON submissions(is_passed);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_exam_time ON submissions(user_id, exam_code, submitted_at);

-- 4. TABLE SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 5. TABLE EXAM_PROGRESS
CREATE TABLE IF NOT EXISTS exam_progress (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code VARCHAR(5) NOT NULL,
    attempts INT DEFAULT 0,
    best_score INT DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exam_code)
);

CREATE INDEX IF NOT EXISTS idx_exam_progress_user_id ON exam_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_progress_exam_code ON exam_progress(exam_code);
CREATE INDEX IF NOT EXISTS idx_exam_progress_best_score ON exam_progress(best_score);
CREATE INDEX IF NOT EXISTS idx_exam_progress_completed ON exam_progress(completed);

-- 6. TABLE AUDIT_LOG
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_progress_updated_at BEFORE UPDATE ON exam_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function initializeDatabase() {
    let client;
    try {
        console.log('🔄 Connexion à Supabase PostgreSQL...');
        
        client = await pool.connect();
        console.log('✓ Connecté à Supabase PostgreSQL');

        // Créer les tables
        console.log('\n🔄 Création des tables...');
        
        // Diviser par ";" pour chaque statement
        const statements = CREATE_TABLES_SQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            try {
                await client.query(statement);
                const tableName = statement.match(/(?:CREATE TABLE|CREATE TRIGGER|CREATE OR REPLACE FUNCTION|CREATE (?:UNIQUE )?INDEX) (?:IF NOT EXISTS )?(?:`)?(\w+)(?:`)?/i);
                if (tableName) {
                    console.log(`  ✓ ${tableName[0].match(/CREATE \w+/)[0]}: "${tableName[1]}"`);
                }
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    throw err;
                }
            }
        }

        // Afficher les tables créées
        console.log('\n📊 Tables dans la base de données:');
        const result = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
        );
        result.rows.forEach(row => {
            console.log(`  • ${row.table_name}`);
        });

        console.log('\n✅ Base de données initialisée avec succès!');
        console.log('\nProchaines étapes:');
        console.log('1. Confirmer les variables d\'environnement dans .env');
        console.log('2. Lancer le backend: npm run dev');
        console.log('3. Lancer le mobile: npm start (depuis permis-backend/permis)');

    } catch (error) {
        console.error('\n❌ Erreur lors de l\'initialisation:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        console.log('\n🔌 Connexion fermée');
    }
}

// Vérifier les paramètres
console.log('═'.repeat(60));
console.log('🗄️  INITIALISATION SUPABASE PostgreSQL');
console.log('═'.repeat(60));
console.log(`\nConfiguration:
  Database URL: ${process.env.DATABASE_URL ? '✓ Configuré' : '⚠ Non configuré'}
  Host: ${process.env.DB_HOST}
  User: ${process.env.DB_USER}
  Database: ${process.env.DB_NAME}
`);

// Exécuter l'initialisation
initializeDatabase();
