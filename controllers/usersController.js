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

        console.log(`[USER LOGIN] Tentative connexion email: ${email}`);

        let conn;
        try {
            conn = await pool.getConnection();
        } catch (error) {
            console.error(`[USER LOGIN] Erreur connexion pool:`, error.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Impossible de connecter à la DB" });
        }

        console.log(`[USER LOGIN] Connexion DB établie, exécution query...`);

        let users;
        try {
            [users] = await conn.query("SELECT * FROM users WHERE email = ?", [email]);
            console.log(`[USER LOGIN] Query exécutée, users.length=${users ? users.length : "UNDEFINED"}`);
        } catch (queryError) {
            conn.release();
            console.error(`[USER LOGIN] Erreur query:`, queryError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur DB query" });
        }

        conn.release();

        if (!users || users.length === 0) {
            console.log(`[USER LOGIN] Aucun utilisateur trouvé pour email: ${email}`);
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const user = users[0];
        console.log(`[USER LOGIN] Utilisateur trouvé: id=${user.id}, nom=${user.nom}, password=${user.password ? "PRESENT" : "NULL"}`);

        // Vérifier que le password existe et est valide
        if (!user.password || typeof user.password !== 'string') {
            console.error(`[USER LOGIN] ERREUR: user.password invalide pour id=${user.id} (type: ${typeof user.password})`);
            return res.status(500).json({ message: "Erreur serveur", error: "Données utilisateur invalides" });
        }

        // Vérifier le mot de passe
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(password, user.password);
            console.log(`[USER LOGIN] Comparaison bcrypt: ${passwordMatch ? "OK" : "FAIL"}`);
        } catch (bcryptError) {
            console.error(`[USER LOGIN] Erreur bcrypt.compare:`, bcryptError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur authentification" });
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        // Générer token JWT
        let token;
        try {
            token = jwt.sign(
                { id: user.id, email: user.email, type: "user" },
                process.env.JWT_SECRET || "secret",
                { expiresIn: process.env.JWT_EXPIRE || "7d" }
            );
            console.log(`[USER LOGIN] Token JWT généré avec succès`);
        } catch (jwtError) {
            console.error(`[USER LOGIN] Erreur JWT.sign:`, jwtError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur génération token" });
        }

        console.log(`[USER LOGIN] Connexion réussie pour ${email}`);

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
        console.error("[USER LOGIN] Exception non tractée:", error.message);
        console.error("[USER LOGIN] Stack:", error.stack);
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