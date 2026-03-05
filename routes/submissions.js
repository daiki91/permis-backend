const express = require("express");
const router = express.Router();
const {
    submitExam,
    getUserResults,
    getExamResult
} = require("../controllers/submissionsController");

/**
 * Routes publiques pour soumettre les examens
 * Les réponses sont envoyées directement depuis le frontend
 */

// POST /submissions/submit - Soumettre un examen
router.post("/submit", submitExam);

// GET /submissions/user/:userId - Récupérer tous les résultats d'un utilisateur
router.get("/user/:userId", getUserResults);

// GET /submissions/result/:userId/:examCode - Récupérer le résultat d'un examen
router.get("/result/:userId/:examCode", getExamResult);

module.exports = router;

