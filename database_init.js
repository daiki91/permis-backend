/**
 * Script d'Installation de la Base de Données
 * Crée toutes les tables nécessaires au projet Permis
 * 
 * Utilisation: node database_init.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'passer',
    database: process.env.DB_NAME || 'permis',
};

const CREATE_TABLES_SQL = `
-- 1. TABLE USERS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLE ADMINS
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLE SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_code VARCHAR(5) NOT NULL,
    answers JSON NOT NULL,
    correct_count INT NOT NULL,
    total_count INT NOT NULL DEFAULT 25,
    percentage INT NOT NULL,
    is_passed BOOLEAN GENERATED ALWAYS AS (percentage >= 80) STORED,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_exam_code (exam_code),
    INDEX idx_percentage (percentage),
    INDEX idx_is_passed (is_passed),
    INDEX idx_submitted_at (submitted_at),
    UNIQUE INDEX idx_user_exam_time (user_id, exam_code, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLE SESSIONS (Optionnel)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLE EXAM_PROGRESS (Optionnel)
CREATE TABLE IF NOT EXISTS exam_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_code VARCHAR(5) NOT NULL,
    attempts INT DEFAULT 0,
    best_score INT DEFAULT 0,
    last_attempt_at TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_exam (user_id, exam_code),
    INDEX idx_user_id (user_id),
    INDEX idx_exam_code (exam_code),
    INDEX idx_best_score (best_score),
    INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLE AUDIT_LOG (Optionnel)
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    admin_id INT,
    action VARCHAR(50),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function initializeDatabase() {
    let connection;
    try {
        console.log('🔄 Connexion à MariaDB...');
        
        // Connexion sans base de données spécifiée
        connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
        });

        console.log('✓ Connecté à MariaDB');

        // Créer la base de données
        console.log(`\n🔄 Création de la base de données "${config.database}"...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        console.log(`✓ Base de données créée ou déjà existante`);

        // Sélectionner la base de données
        await connection.query(`USE ${config.database}`);
        console.log(`✓ Base de données sélectionnée`);

        // Créer les tables
        console.log('\n🔄 Création des tables...');
        // Extraire explicitement chaque bloc CREATE TABLE ... ;
        const statements = CREATE_TABLES_SQL.match(/CREATE TABLE IF NOT EXISTS[\s\S]*?;/gi) || [];

        for (const rawStatement of statements) {
            const statement = rawStatement.trim();
            const tableName = statement.match(/CREATE TABLE IF NOT EXISTS `?(\w+)`?/i);

            if (!tableName) {
                continue;
            }

            const tableNameStr = tableName[1];
            await connection.query(statement);
            console.log(`  ✓ Table "${tableNameStr}" créée ou déjà existante`);
        }

        // Afficher les tables créées
        console.log('\n📊 Tables dans la base de données:');
        const [tables] = await connection.query('SHOW TABLES');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  • ${tableName}`);
        });

        console.log('\n✅ Base de données initialisée avec succès!');
        console.log('\nProchaines étapes:');
        console.log('1. Configurer les variables d\'environnement dans .env');
        console.log('2. Lancer le backend: npm run dev');
        console.log('3. Lancer le mobile: npm start (depuis permis-mobile)');

    } catch (error) {
        console.error('\n❌ Erreur lors de l\'initialisation:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connexion fermée');
        }
    }
}

// Vérifier les paramètres
console.log('═'.repeat(60));
console.log('🗄️  INITIALISATION DE LA BASE DE DONNÉES');
console.log('═'.repeat(60));
console.log(`\nConfiguration:
  Host: ${config.host}
  User: ${config.user}
  Database: ${config.database}
`);

// Exécuter l'initialisation
initializeDatabase();
