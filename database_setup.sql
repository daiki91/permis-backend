-- ============================================================
-- SCRIPT COMPLET - Création de toutes les tables du projet Permis
-- ============================================================
-- Exécutez ce script dans MariaDB pour initialiser la base de données
-- Date: Mars 2026
-- ============================================================

-- Créer la base de données (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS permis;
USE permis;

-- ============================================================
-- 1. TABLE USERS - Utilisateurs de l'application mobile
-- ============================================================
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

-- ============================================================
-- 2. TABLE ADMINS - Administrateurs de la plateforme
-- ============================================================
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

-- ============================================================
-- 3. TABLE SUBMISSIONS - Soumissions d'examens et notes
-- ============================================================
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_code VARCHAR(5) NOT NULL COMMENT 'B01 à B12',
    answers JSON NOT NULL COMMENT 'Réponses de l\'utilisateur en JSON',
    correct_count INT NOT NULL COMMENT 'Nombre de bonnes réponses',
    total_count INT NOT NULL DEFAULT 25 COMMENT 'Total des questions (toujours 25)',
    percentage INT NOT NULL COMMENT 'Pourcentage (0-100)',
    is_passed BOOLEAN GENERATED ALWAYS AS (percentage >= 80) STORED COMMENT 'TRUE si >= 80%',
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

-- ============================================================
-- 4. TABLE SESSIONS (Optionnel) - Gérer les sessions utilisateur
-- ============================================================
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

-- ============================================================
-- 5. TABLE EXAM_PROGRESS (Optionnel) - Progression par examen
-- ============================================================
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

-- ============================================================
-- 6. TABLE AUDIT_LOG (Optionnel) - Journal d'audit
-- ============================================================
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

-- ============================================================
-- AFFICHER LES TABLES CRÉÉES
-- ============================================================
SHOW TABLES;

-- ============================================================
-- VÉRIFIER LA STRUCTURE
-- ============================================================
DESC users;
DESC admins;
DESC submissions;
DESC sessions;
DESC exam_progress;
DESC audit_log;

-- ============================================================
-- Exemples de données de test (Optionnel)
-- ============================================================

-- Insérer un utilisateur de test
INSERT INTO users (nom, email, telephone, password) 
VALUES ('Utilisateur Test', 'test@example.com', '0612345678', 'hashed_password_here');

-- Insérer un administrateur de test
INSERT INTO admins (nom, email, password, role) 
VALUES ('Admin Test', 'admin@example.com', 'hashed_password_here', 'admin');

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- Toutes les tables ont été créées avec succès!
-- Vous pouvez maintenant commencer à utiliser l'application.
