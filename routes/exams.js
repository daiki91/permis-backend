const express = require("express");
const router = express.Router();
const examsStaticController = require("../controllers/examsStaticController");

// Route publique - Récupérer tous les 12 examens (B01-B12)
router.get("/", examsStaticController.getAllExams);

// Route publique - Récupérer les détails d'un examen (couverture + 25 questions)
router.get("/:examCode", examsStaticController.getExamDetails);

// Route publique - Récupérer les options de réponse d'une question
router.get("/:examCode/question/:questionNum/options", examsStaticController.getQuestionOptions);

// Route publique - Récupérer l'image d'une question
router.get("/:examCode/question/:questionNum/image", examsStaticController.getQuestionImage);

module.exports = router;
