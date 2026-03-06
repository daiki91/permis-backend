-- ============================================================
-- RESET COMPLET BASE DE DONNEES (PostgreSQL / Supabase)
-- Projet: permis-backend
-- ============================================================
-- Ce script:
-- 1) Supprime toutes les tables applicatives
-- 2) Recree tout le schema utilise par le backend
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) DROP (ordre inverse des dependances)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS response_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS exam_progress CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Nettoyage objets utilitaires
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ------------------------------------------------------------
-- 2) TABLES PRINCIPALES
-- ------------------------------------------------------------

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Examens dynamiques crees par admin
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    nombre_questions INT DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    numero INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, numero)
);

CREATE TABLE response_options (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_letter CHAR(1) NOT NULL,
    position INT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (question_id, option_letter)
);

-- Soumissions des examens statiques B01..B12
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code VARCHAR(5) NOT NULL,
    answers JSONB NOT NULL,
    correct_count INT NOT NULL,
    total_count INT NOT NULL DEFAULT 25,
    percentage INT NOT NULL,
    is_passed BOOLEAN GENERATED ALWAYS AS (percentage >= 80) STORED,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3) TABLES COMPLEMENTAIRES (compatibilite projet)
-- ------------------------------------------------------------

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_progress (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code VARCHAR(5) NOT NULL,
    attempts INT DEFAULT 0,
    best_score INT DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, exam_code)
);

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4) INDEXES
-- ------------------------------------------------------------

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_is_active ON admins(is_active);
CREATE INDEX idx_admins_created_at ON admins(created_at);

CREATE INDEX idx_exams_admin_id ON exams(admin_id);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_response_options_question_id ON response_options(question_id);

CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_exam_code ON submissions(exam_code);
CREATE INDEX idx_submissions_percentage ON submissions(percentage);
CREATE INDEX idx_submissions_is_passed ON submissions(is_passed);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE UNIQUE INDEX idx_submissions_user_exam_time ON submissions(user_id, exam_code, submitted_at);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_exam_progress_user_id ON exam_progress(user_id);
CREATE INDEX idx_exam_progress_exam_code ON exam_progress(exam_code);
CREATE INDEX idx_exam_progress_best_score ON exam_progress(best_score);
CREATE INDEX idx_exam_progress_completed ON exam_progress(completed);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ------------------------------------------------------------
-- 5) TRIGGERS updated_at
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exams_updated_at
BEFORE UPDATE ON exams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exam_progress_updated_at
BEFORE UPDATE ON exam_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ------------------------------------------------------------
-- 6) VERIFICATION RAPIDE
-- ------------------------------------------------------------
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

-- ------------------------------------------------------------
-- 7) (OPTIONNEL) ADMIN PAR DEFAUT
-- ------------------------------------------------------------
-- Remplace le hash par un vrai hash bcrypt avant insertion.
-- INSERT INTO admins (nom, email, password, role, is_active)
-- VALUES ('Admin', 'admin@example.com', '$2b$10$REPLACE_WITH_BCRYPT_HASH', 'admin', TRUE);
