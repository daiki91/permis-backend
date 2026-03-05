const path = require("path");
const fs = require("fs");

// Récupérer tous les 12 examens avec leur image de couverture
exports.getAllExams = (req, res) => {
    try {
        const assetsDir = path.join(__dirname, "..", "assets");
        const exams = [];

        // Boucler de B01 à B12
        for (let i = 1; i <= 12; i++) {
            const examCode = `B${String(i).padStart(2, "0")}`;
            const examDir = path.join(assetsDir, examCode);

            // Vérifier si le dossier existe
            if (fs.existsSync(examDir)) {
                exams.push({
                    id: i,
                    code: examCode,
                    titre: `Examen ${examCode}`,
                    description: `Epreuve de code ${examCode} - 25 questions`,
                    nombre_questions: 25,
                    image_couverture: `/assets/${examCode}/${examCode} COUV.JPG`,
                    dossier: examCode
                });
            }
        }

        if (exams.length === 0) {
            return res.status(404).json({ 
                message: "Aucun examen trouvé",
                exams: [] 
            });
        }

        res.status(200).json({
            success: true,
            count: exams.length,
            exams: exams
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des examens:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur",
            error: error.message 
        });
    }
};

// Récupérer les détails d'un examen (couverture + 25 questions)
exports.getExamDetails = (req, res) => {
    try {
        const { examCode } = req.params;
        
        // Valider le code examen (B01-B12)
        if (!/^B(0[1-9]|1[0-2])$/.test(examCode)) {
            return res.status(400).json({ 
                message: "Code examen invalide. Format attendu: B01-B12" 
            });
        }

        const assetsDir = path.join(__dirname, "..", "assets");
        const examDir = path.join(assetsDir, examCode);

        // Vérifier si le dossier existe
        if (!fs.existsSync(examDir)) {
            return res.status(404).json({ 
                message: `Examen ${examCode} non trouvé` 
            });
        }

        // Construire les questions (B01-01.JPG à B01-25.JPG)
        const questions = [];
        for (let i = 1; i <= 25; i++) {
            const questionNum = String(i).padStart(2, "0");
            const questionFile = `${examCode}-${questionNum}.JPG`;
            const questionPath = path.join(examDir, questionFile);

            if (fs.existsSync(questionPath)) {
                questions.push({
                    id: i,
                    numero: i,
                    examCode: examCode,
                    image_path: `/assets/${examCode}/${questionFile}`,
                    image_file: questionFile
                });
            }
        }

        // Construire l'image de couverture
        const coverFile = `${examCode} COUV.JPG`;
        const coverPath = path.join(examDir, coverFile);
        let image_couverture = null;

        if (fs.existsSync(coverPath)) {
            image_couverture = `/assets/${examCode}/${coverFile}`;
        }

        res.status(200).json({
            success: true,
            exam: {
                id: parseInt(examCode.substring(1)),
                code: examCode,
                titre: `Examen ${examCode}`,
                description: `Epreuve de code ${examCode} - ${questions.length} questions`,
                nombre_questions: questions.length,
                image_couverture: image_couverture,
                dossier: examCode,
                questions: questions
            }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de l'examen:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur",
            error: error.message 
        });
    }
};

// Récupérer les réponses possibles pour une question
// Pour la v1, on retourne des réponses génériques (A, B, C, D)
exports.getQuestionOptions = (req, res) => {
    try {
        const { examCode, questionNum } = req.params;

        // Valider les paramètres
        if (!/^B(0[1-9]|1[0-2])$/.test(examCode)) {
            return res.status(400).json({ 
                message: "Code examen invalide" 
            });
        }

        const qNum = parseInt(questionNum);
        if (isNaN(qNum) || qNum < 1 || qNum > 25) {
            return res.status(400).json({ 
                message: "Numéro de question invalide (1-25)" 
            });
        }

        // Retourner les 4 options (A, B, C, D)
        // Note: Les bonnes réponses seront définies via admin
        const options = [
            {
                id: 1,
                question_id: qNum,
                option_letter: "A",
                position: 1,
                is_correct: false  // À modifier via admin
            },
            {
                id: 2,
                question_id: qNum,
                option_letter: "B",
                position: 2,
                is_correct: false  // À modifier via admin
            },
            {
                id: 3,
                question_id: qNum,
                option_letter: "C",
                position: 3,
                is_correct: false  // À modifier via admin
            },
            {
                id: 4,
                question_id: qNum,
                option_letter: "D",
                position: 4,
                is_correct: false  // À modifier via admin
            }
        ];

        res.status(200).json({
            success: true,
            options: options
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des options:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur",
            error: error.message 
        });
    }
};

// Récupérer l'image d'une question spécifique
exports.getQuestionImage = (req, res) => {
    try {
        const { examCode, questionNum } = req.params;

        // Valider les paramètres
        if (!/^B(0[1-9]|1[0-2])$/.test(examCode)) {
            return res.status(400).json({ 
                message: "Code examen invalide" 
            });
        }

        const qNum = parseInt(questionNum);
        if (isNaN(qNum) || qNum < 1 || qNum > 25) {
            return res.status(400).json({ 
                message: "Numéro de question invalide (1-25)" 
            });
        }

        const questionNum_padded = String(qNum).padStart(2, "0");
        const questionFile = `${examCode}-${questionNum_padded}.JPG`;
        const imagePath = path.join(__dirname, "..", "assets", examCode, questionFile);

        // Vérifier si le fichier existe
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ 
                message: `Image non trouvée: ${questionFile}` 
            });
        }

        // Envoyer le fichier
        res.sendFile(imagePath);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'image:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur serveur",
            error: error.message 
        });
    }
};
