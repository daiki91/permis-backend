/**
 * SCRIPT SQL - Table Submissions pour Permis
 * 
 * Exécutez ce script dans votre base de données MariaDB
 * pour créer la table permettant l'enregistrement automatique des résultats
 */

-- Table pour enregistrer les soumissions d'examens
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_code VARCHAR(5) NOT NULL,
  answers JSON NOT NULL,
  correct_count INT NOT NULL,
  total_count INT NOT NULL DEFAULT 25,
  percentage INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Index pour les recherches rapides
  INDEX idx_user_id (user_id),
  INDEX idx_exam_code (exam_code),
  INDEX idx_submitted_at (submitted_at),
  UNIQUE INDEX idx_user_exam_time (user_id, exam_code, submitted_at)
);

-- Ajouter une colonne is_passed si elle n'existe pas
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_passed BOOLEAN GENERATED ALWAYS AS (percentage >= 80) STORED;

-- Exemple d'insertion pour tester
-- INSERT INTO submissions (user_id, exam_code, answers, correct_count, total_count, percentage)
-- VALUES (
--   1,
--   'B01',
--   '{"1":["A"],"2":["B"],"3":["A","C"]}',
--   20,
--   25,
--   80
-- );
