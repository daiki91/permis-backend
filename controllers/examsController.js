const pool = require("../db");
const fs = require("fs");
const path = require("path");

// Créer un examen
exports.createExam = async (req, res) => {
    try {
        const { titre, description, nombre_questions } = req.body;
        const adminId = req.admin.id;

        if (!titre) {
            return res.status(400).json({ message: "Le titre de l'examen est requis" });
        }

        const conn = await pool.getConnection();
        const [result] = await conn.query(
            "INSERT INTO exams (admin_id, titre, description, nombre_questions) VALUES (?, ?, ?, ?)",
            [adminId, titre, description, nombre_questions || 40]
        );

        conn.release();

        res.status(201).json({
            message: "Examen créé avec succès",
            exam_id: result.insertId
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer toutes les examens d'un administrateur
exports.getExamsByAdmin = async (req, res) => {
    try {
        const adminId = req.admin.id;
        
        const conn = await pool.getConnection();
        const [exams] = await conn.query(
            "SELECT e.*, COUNT(q.id) as question_count FROM exams e LEFT JOIN questions q ON e.id = q.exam_id WHERE e.admin_id = ? GROUP BY e.id",
            [adminId]
        );
        conn.release();

        res.json(exams);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer tous les examens disponibles (pour les utilisateurs)
exports.getAllExams = async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [exams] = await conn.query(
            "SELECT e.id, e.titre, e.description, e.nombre_questions, COUNT(q.id) as question_count FROM exams e LEFT JOIN questions q ON e.id = q.exam_id GROUP BY e.id"
        );
        conn.release();

        res.json(exams);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer un examen avec ses questions et options
exports.getExamDetails = async (req, res) => {
    try {
        const examId = req.params.examId;

        const conn = await pool.getConnection();
        
        // Récupérer l'examen
        const [exams] = await conn.query("SELECT * FROM exams WHERE id = ?", [examId]);
        
        if (exams.length === 0) {
            conn.release();
            return res.status(404).json({ message: "Examen non trouvé" });
        }

        const exam = exams[0];

        // Récupérer les questions avec leurs options
        const [questions] = await conn.query(
            `SELECT q.*, GROUP_CONCAT(
                JSON_OBJECT('id', ro.id, 'letter', ro.option_letter, 'position', ro.position)
                ORDER BY ro.position
            ) as options
            FROM questions q
            LEFT JOIN response_options ro ON q.id = ro.question_id
            WHERE q.exam_id = ?
            GROUP BY q.id
            ORDER BY q.numero`,
            [examId]
        );

        // Parser les options JSON
        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(`[${q.options}]`) : []
        }));

        conn.release();

        res.json({
            ...exam,
            questions: questionsWithOptions
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Ajouter une question avec une image
exports.addQuestion = async (req, res) => {
    try {
        const { exam_id, numero } = req.body;

        if (!exam_id || !numero || !req.file) {
            return res.status(400).json({ message: "exam_id, numero et image sont requis" });
        }

        const imagePath = `uploads/exams/${exam_id}/${req.file.filename}`;

        const conn = await pool.getConnection();
        const [result] = await conn.query(
            "INSERT INTO questions (exam_id, numero, image_path) VALUES (?, ?, ?)",
            [exam_id, numero, imagePath]
        );

        conn.release();

        res.status(201).json({
            message: "Question ajoutée avec succès",
            question_id: result.insertId,
            image_path: imagePath
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Ajouter les options de réponse pour une question
exports.addResponseOptions = async (req, res) => {
    try {
        const { question_id, options } = req.body;

        if (!question_id || !Array.isArray(options) || options.length !== 4) {
            return res.status(400).json({ message: "question_id et 4 options avec letters (A, B, C, D) et is_correct sont requis" });
        }

        const conn = await pool.getConnection();

        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            await conn.query(
                "INSERT INTO response_options (question_id, option_letter, position, is_correct) VALUES (?, ?, ?, ?)",
                [question_id, option.letter, i + 1, option.is_correct ? 1 : 0]
            );
        }

        conn.release();

        res.json({ message: "Options de réponse ajoutées avec succès" });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Supprimer un examen
exports.deleteExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const adminId = req.admin.id;

        const conn = await pool.getConnection();
        
        // Vérifier que l'examen appartient à l'admin
        const [exams] = await conn.query("SELECT id FROM exams WHERE id = ? AND admin_id = ?", [examId, adminId]);
        
        if (exams.length === 0) {
            conn.release();
            return res.status(403).json({ message: "Vous n'avez pas la permission de supprimer cet examen" });
        }

        // Supprimer l'examen (les cascades supprimeront questions, options, etc.)
        await conn.query("DELETE FROM exams WHERE id = ?", [examId]);

        // Supprimer les fichiers images
        const uploadsDir = path.join(__dirname, `../uploads/exams/${examId}`);
        if (fs.existsSync(uploadsDir)) {
            fs.rmSync(uploadsDir, { recursive: true });
        }

        conn.release();

        res.json({ message: "Examen supprimé avec succès" });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
