const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// Enregistrer un utilisateur
exports.register = async (req, res) => {
    try {
        const { nom, email, telephone, password, confirm_password } = req.body;

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
        const [users] = await conn.query("SELECT id FROM users WHERE email = ?", [email]);
        
        if (users.length > 0) {
            conn.release();
            return res.status(409).json({ message: "Cet email est déjà utilisé" });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur
        await conn.query(
            "INSERT INTO users (nom, email, telephone, password) VALUES (?, ?, ?, ?)",
            [nom, email, telephone, hashedPassword]
        );

        conn.release();

        res.status(201).json({ message: "Utilisateur enregistré avec succès" });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const conn = await pool.getConnection();
        const [users] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);

        conn.release();

        if (users.length === 0) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        // Générer token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, type: "user" },
            process.env.JWT_SECRET || "secret",
            { expiresIn: process.env.JWT_EXPIRE || "7d" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                telephone: user.telephone
            }
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer les informations de l'utilisateur
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const conn = await pool.getConnection();
        const [users] = await conn.query("SELECT id, nom, email, telephone, created_at FROM users WHERE id = ?", [userId]);
        conn.release();

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json(users[0]);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nom, telephone } = req.body;

        const conn = await pool.getConnection();
        await conn.query(
            "UPDATE users SET nom = ?, telephone = ? WHERE id = ?",
            [nom, telephone, userId]
        );
        conn.release();

        res.json({ message: "Profil mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};