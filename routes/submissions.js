const express = require("express");
const router = express.Router();
const {
    submitExam,
    getUserResults,
    getExamResult,
    getAllSubmissions,
    getSubmissionById
} = require("../controllers/submissionsController");
const { authenticateToken, authenticateAdmin } = require("../middlewares/auth");

/**
 * Routes publiques pour soumettre les examens
 * Les réponses sont envoyées directement depuis le frontend
 */

// POST /submissions/submit - Soumettre un examen
router.post("/submit", submitExam);

// GET /submissions - Obtenir toutes les soumissions (admin)
router.get("/", getAllSubmissions);

// GET /submissions/user/:userId - Récupérer tous les résultats d'un utilisateur (auth requise)
router.get("/user/:userId", authenticateToken, getUserResults);

// GET /submissions/result/:userId/:examCode - Récupérer le résultat d'un examen
router.get("/result/:userId/:examCode", getExamResult);

// GET /submissions/:id - Obtenir le détail d'une soumission par ID (admin)
router.get("/:id", getSubmissionById);

module.exports = router;
