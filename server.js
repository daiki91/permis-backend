require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const usersRoutes = require("./routes/users");
const adminsRoutes = require("./routes/admins");
const examsRoutes = require("./routes/exams");
const submissionsRoutes = require("./routes/submissions");

const app = express();

// Création du dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir les images d'examens (assets)
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
app.use("/users", usersRoutes);
app.use("/admins", adminsRoutes);
app.use("/exams", examsRoutes);
app.use("/submissions", submissionsRoutes);

// Route de test
app.get("/", (req, res) => {
    res.json({
        message: "Bienvenue à l'API Permis Backend",
        version: "1.0.0",
        endpoints: {
            users: {
                register: "POST /users/register",
                login: "POST /users/login",
                profile: "GET /users/profile",
                updateProfile: "PUT /users/profile"
            },
            admins: {
                register: "POST /admins/register",
                login: "POST /admins/login",
                profile: "GET /admins/profile",
                createExam: "POST /admins/exams",
                getExams: "GET /admins/exams",
                addQuestion: "POST /admins/exams/:examId/questions",
                deleteExam: "DELETE /admins/exams/:examId"
            },
            exams: {
                getAllExams: "GET /admins/exams/public/all",
                getExamDetails: "GET /admins/exams/public/:examId"
            },
            submissions: {
                startExam: "POST /submissions/exams/:examId/start",
                saveAnswer: "POST /submissions/answers/save",
                submitExam: "POST /submissions/exams/submit",
                getSubmissions: "GET /submissions/submissions"
            }
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error("Erreur:", err);
    res.status(500).json({
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? err.message : "Erreur interne"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ Serveur lancé sur http://localhost:${PORT}`);
});