const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { register, login, getProfile } = require("../controllers/adminsController");
const {
    createExam,
    getExamsByAdmin,
    getAllExams,
    getExamDetails,
    addQuestion,
    addResponseOptions,
    deleteExam
} = require("../controllers/examsController");
const {
    getExamSubmissions
} = require("../controllers/submissionsController");
const { authenticateAdmin } = require("../middlewares/auth");

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const examId = req.body.exam_id || "temp";
        const dir = path.join(__dirname, `../uploads/exams/${examId}`);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format d\'image non accepté'));
        }
    }
});

// Routes publiques
router.post("/register", register);
router.post("/login", login);

// Routes protégées (nécessitent authentification admin)
router.get("/profile", authenticateAdmin, getProfile);
router.post("/exams", authenticateAdmin, createExam);
router.get("/exams", authenticateAdmin, getExamsByAdmin);
router.delete("/exams/:examId", authenticateAdmin, deleteExam);
router.post("/exams/:examId/questions", authenticateAdmin, upload.single("image"), addQuestion);
router.post("/exams/:examId/questions/:questionId/options", authenticateAdmin, addResponseOptions);
router.get("/exams/:examId/submissions", authenticateAdmin, getExamSubmissions);

// Routes publiques pour les utilisateurs
router.get("/exams/public/all", getAllExams);
router.get("/exams/public/:examId", getExamDetails);

module.exports = router;
