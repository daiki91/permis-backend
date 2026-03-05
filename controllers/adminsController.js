const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Enregistrer un administrateur
exports.register = async (req, res) => {
    try {
        const { nom, email, password, confirm_password } = req.body;

        // Validation
        if (!nom || !email || !password) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
        }

        // Vérifier si l'email existe déjà
        const conn = await pool.getConnection();
        const [admins] = await conn.query("SELECT id FROM admins WHERE email = ?", [email]);
        
        if (admins.length > 0) {
            conn.release();
            return res.status(409).json({ message: "Cet email est déjà utilisé" });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'administrateur
        await conn.query(
            "INSERT INTO admins (nom, email, password) VALUES (?, ?, ?)",
            [nom, email, hashedPassword]
        );

        conn.release();

        res.status(201).json({ message: "Administrateur enregistré avec succès" });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Connexion d'un administrateur
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const conn = await pool.getConnection();
        const [admins] = await conn.query("SELECT * FROM admins WHERE email = ?", [email]);

        conn.release();

        if (admins.length === 0) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const admin = admins[0];

        // Vérifier le mot de passe
        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        // Générer token JWT
        const token = jwt.sign(
            { id: admin.id, email: admin.email, type: "admin" },
            process.env.JWT_SECRET || "secret",
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            admin: {
                id: admin.id,
                nom: admin.nom,
                email: admin.email
            }
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer le profil de l'administrateur
exports.getProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const conn = await pool.getConnection();
        const [admins] = await conn.query("SELECT id, nom, email, created_at FROM admins WHERE id = ?", [adminId]);
        conn.release();

        if (admins.length === 0) {
            return res.status(404).json({ message: "Administrateur non trouvé" });
        }

        res.json(admins[0]);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
