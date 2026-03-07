const pool = require("../db");
const corrections = require("../correction");

/**
 * Soumettre un examen et calculer la note automatiquement
 */
exports.submitExam = async (req, res) => {
  let connection;
  try {
    const { userId, examCode, answers } = req.body;

    console.log('=== SUBMISSION RECEIVED ===');
    console.log('userId:', userId);
    console.log('examCode:', examCode);
    console.log('answers keys:', Object.keys(answers || {}));
    console.log('answers sample:', JSON.stringify(answers).substring(0, 200));

    // Validation des données
    if (!userId || !examCode || !answers || typeof answers !== 'object') {
      console.error('Validation failed:', { userId, examCode, hasAnswers: !!answers });
      return res.status(400).json({
        success: false,
        message: 'Données invalides: userId, examCode et answers requis'
      });
    }

    // Vérifier que l'examen existe
    const validExams = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12'];
    if (!validExams.includes(examCode)) {
      console.error('Invalid exam code:', examCode);
      return res.status(400).json({
        success: false,
        message: 'Code examen invalide'
      });
    }

    console.log('Normalizing answers...');
    const normalizedAnswers = normalizeAnswersPayload(answers);
    console.log('Normalized sample:', JSON.stringify(Object.entries(normalizedAnswers).slice(0, 3)));

    // Corriger les réponses
    console.log('Starting correction...');
    const correctionResult = correctExam(examCode, normalizedAnswers);
    console.log('Correction result:', {
      correctCount: correctionResult.correctCount,
      totalQuestions: correctionResult.totalQuestions,
      percentage: correctionResult.percentage
    });

    // Enregistrer la soumission en BD
    const query = `
      INSERT INTO submissions (user_id, exam_code, answers, correct_count, total_count, percentage, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    console.log('Getting DB connection...');
    connection = await pool.getConnection();
    console.log('Executing query...');
    const result = await connection.query(query, [
      userId,
      examCode,
      JSON.stringify(normalizedAnswers),
      correctionResult.correctCount,
      correctionResult.totalQuestions,
      correctionResult.percentage,
    ]);
    console.log('Query executed successfully:', result[0]);

    // Retourner le résultat
    return res.status(200).json({
      success: true,
      message: 'Examen corrigé et enregistré',
      data: {
        examCode,
        userId,
        correctCount: correctionResult.correctCount,
        totalQuestions: correctionResult.totalQuestions,
        percentage: correctionResult.percentage,
        isPassed: correctionResult.isPassed,
        details: correctionResult.details,
      }
    });
  } catch (error) {
    console.error('=== SUBMISSION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      name: error.name,
    });

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Une soumission identique existe deja. Reessayez dans quelques secondes.'
      });
    }

    return res.status(500).json({
      success: false,
      message: `Erreur lors de la soumission: ${error.message}`
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
/**
 * Corriger les réponses d'un examen
 * @param {string} examCode - Code de l'examen (B01-B12)
 * @param {object} answers - { questionNum: ['A', 'B', ...] }
 * @returns {object} Résultat de la correction
 */
function correctExam(examCode, answers) {
  const correctAnswers = corrections[examCode];
  
  if (!correctAnswers) {
    throw new Error(`Correction non trouvée pour ${examCode}`);
  }

  let correctCount = 0;
  let totalQuestions = 25;
  const details = [];

  // Pour chaque question le fichier de correction contient une chaîne, ex: 'BD'
  // Il faut la convertir en array ['B', 'D']
  for (let questionNum = 1; questionNum <= totalQuestions; questionNum++) {
    const correctLetters = convertCorrectAnswer(correctAnswers[questionNum - 1]);
    const userAnswers = normalizeAnswerSelection(answers[questionNum]);

    // Vérifier si les réponses de l'utilisateur sont exactement correctes
    const isCorrect = arraysEqual(
      sortedCopy(userAnswers),
      sortedCopy(correctLetters)
    );

    if (isCorrect) {
      correctCount++;
    }

    details.push({
      questionNum,
      correctAnswers: correctLetters,
      userAnswers,
      isCorrect
    });
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return {
    correctCount,
    totalQuestions,
    percentage,
    isPassed: percentage >= 80, // 80% = succès
    details
  };
}

/**
 * Convertir la chaîne de correction ('BD') en array (['B', 'D'])
 */
function convertCorrectAnswer(answer) {
  if (!answer || typeof answer !== 'string') {
    return [];
  }
  return answer
    .split('')
    .map((letter) => letter.trim().toUpperCase())
    .filter((letter) => /^[A-Z]$/.test(letter));
}

/**
 * Normaliser l'objet answers recu du client.
 */
function normalizeAnswersPayload(answers) {
  const normalized = {};

  for (let questionNum = 1; questionNum <= 25; questionNum++) {
    const raw = answers[questionNum] ?? answers[String(questionNum)];
    normalized[questionNum] = normalizeAnswerSelection(raw);
  }

  return normalized;
}

/**
 * Normaliser une reponse en tableau de lettres majuscules (A-Z).
 */
function normalizeAnswerSelection(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim().toUpperCase())
      .filter((v) => /^[A-Z]$/.test(v));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const parts = trimmed.includes(',')
      ? trimmed.split(',')
      : trimmed.split('');

    return parts
      .map((v) => v.trim().toUpperCase())
      .filter((v) => /^[A-Z]$/.test(v));
  }

  return [];
}

function sortedCopy(arr) {
  return [...arr].sort();
}

/**
 * Comparer deux arrays
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, idx) => val === arr2[idx]);
}

/**
 * Récupérer les résultats d'un utilisateur
 */
exports.getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT id, exam_code, correct_count, total_count, percentage, is_passed,
             submitted_at
      FROM submissions
      WHERE user_id = ?
      ORDER BY submitted_at DESC
    `;

    const connection = await pool.getConnection();
    const [results] = await connection.query(query, [userId]);
    connection.release();

    return res.status(200).json({
      success: true,
      data: {
        totalSubmissions: results.length,
        results: results
      }
    });
  } catch (error) {
    console.error('Erreur récupération résultats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des résultats'
    });
  }
};

/**
 * Récupérer le résultat d'un examen spécifique
 */
exports.getExamResult = async (req, res) => {
  try {
    const { userId, examCode } = req.params;

    const query = `
      SELECT id, exam_code, answers, correct_count, total_count, 
             percentage, submitted_at
      FROM submissions
      WHERE user_id = ? AND exam_code = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `;

    const connection = await pool.getConnection();
    const [results] = await connection.query(query, [userId, examCode]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Résultat non trouvé'
      });
    }

    const result = results[0];
    result.answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers;
    const computed = correctExam(examCode, result.answers);

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        isPassed: result.percentage >= 80,
        details: computed.details,
      }
    });
  } catch (error) {
    console.error('Erreur récupération résultat examen:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résultat'
    });
  }
};

/**
 * Récupérer toutes les soumissions pour un examen (usage admin)
 */
exports.getExamSubmissions = async (req, res) => {
  try {
    const { examId } = req.params;

    const query = `
      SELECT s.id, s.user_id, u.nom AS user_name, u.email AS user_email,
             s.exam_code, s.correct_count, s.total_count, s.percentage, s.submitted_at
      FROM submissions s
      LEFT JOIN users u ON u.id = s.user_id
      WHERE s.exam_code = ?
      ORDER BY s.submitted_at DESC
    `;

    const connection = await pool.getConnection();
    const [results] = await connection.query(query, [examId]);
    connection.release();

    return res.status(200).json({
      success: true,
      data: {
        examCode: examId,
        totalSubmissions: results.length,
        submissions: results,
      },
    });
  } catch (error) {
    console.error("Erreur récupération soumissions examen:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des soumissions",
    });
  }
};

