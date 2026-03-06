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

        console.log(`[ADMIN LOGIN] Tentative connexion email: ${email}`);

        let conn;
        try {
            conn = await pool.getConnection();
        } catch (error) {
            console.error(`[ADMIN LOGIN] Erreur connexion pool:`, error.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Impossible de connecter à la DB" });
        }

        console.log(`[ADMIN LOGIN] Connexion DB établie, exécution query...`);
        
        let admins;
        try {
            [admins] = await conn.query("SELECT * FROM admins WHERE email = ?", [email]);
            console.log(`[ADMIN LOGIN] Query exécutée, admins.length=${admins ? admins.length : "UNDEFINED"}`);
        } catch (queryError) {
            conn.release();
            console.error(`[ADMIN LOGIN] Erreur query:`, queryError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur DB query" });
        }

        conn.release();

        if (!admins || admins.length === 0) {
            console.log(`[ADMIN LOGIN] Aucun admin trouvé pour email: ${email}`);
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        const admin = admins[0];
        console.log(`[ADMIN LOGIN] Admin trouvé: id=${admin.id}, nom=${admin.nom}, password=${admin.password ? "PRESENT" : "NULL"}`);

        // Vérifier que le password existe et est valide
        if (!admin.password || typeof admin.password !== 'string') {
            console.error(`[ADMIN LOGIN] ERREUR: admin.password invalide pour id=${admin.id} (type: ${typeof admin.password})`);
            return res.status(500).json({ message: "Erreur serveur", error: "Données utilisateur invalides" });
        }

        // Vérifier le mot de passe
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(password, admin.password);
            console.log(`[ADMIN LOGIN] Comparaison bcrypt: ${passwordMatch ? "OK" : "FAIL"}`);
        } catch (bcryptError) {
            console.error(`[ADMIN LOGIN] Erreur bcrypt.compare:`, bcryptError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur authentification" });
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }

        // Générer token JWT
        let token;
        try {
            token = jwt.sign(
                { id: admin.id, email: admin.email, type: "admin" },
                process.env.JWT_SECRET || "secret",
                { expiresIn: process.env.JWT_EXPIRE || "7d" }
            );
            console.log(`[ADMIN LOGIN] Token JWT généré avec succès`);
        } catch (jwtError) {
            console.error(`[ADMIN LOGIN] Erreur JWT.sign:`, jwtError.message);
            return res.status(500).json({ message: "Erreur serveur", error: "Erreur génération token" });
        }

        console.log(`[ADMIN LOGIN] Connexion réussie pour ${email}`);

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
        console.error("[ADMIN LOGIN] Exception non tractée:", error.message);
        console.error("[ADMIN LOGIN] Stack:", error.stack);
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

// Récupérer tous les utilisateurs (pour admin)
exports.getAllUsers = async (req, res) => {
    try {
        console.log('[ADMIN] Récupération de tous les utilisateurs...');
        const conn = await pool.getConnection();
        const [users] = await conn.query(`
            SELECT 
                u.id,
                u.nom,
                u.email,
                u.telephone,
                u.created_at,
                COUNT(s.id) as total_submissions,
                COALESCE(ROUND(AVG(s.percentage), 1), 0) as avg_percentage,
                MAX(s.submitted_at) as last_activity
            FROM users u
            LEFT JOIN submissions s ON s.user_id = u.id
            GROUP BY u.id, u.nom, u.email, u.telephone, u.created_at
            ORDER BY created_at DESC
        `);
        conn.release();
        
        console.log(`[ADMIN] ${users.length} utilisateurs récupérés`);
        res.json(users);
    } catch (error) {
        console.error("[ADMIN] Erreur lors de la récupération des utilisateurs:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Récupérer les détails d'un utilisateur (pour admin)
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[ADMIN] Récupération détails utilisateur id=${userId}`);
        const conn = await pool.getConnection();
        
        // Récupérer les infos de l'utilisateur
        const [users] = await conn.query(`
            SELECT id, nom, email, telephone, created_at 
            FROM users 
            WHERE id = ?
        `, [userId]);

        if (users.length === 0) {
            conn.release();
            console.log(`[ADMIN] Utilisateur id=${userId} non trouvé`);
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Récupérer les statistiques des soumissions
        const [submissions] = await conn.query(`
             SELECT
                 COUNT(*) as total_submissions,
                 COUNT(DISTINCT exam_code) as completed_exams,
                 COALESCE(ROUND(AVG(percentage), 1), 0) as avg_score,
                 SUM(CASE WHEN percentage >= 80 THEN 1 ELSE 0 END) as passed_exams,
                 MAX(submitted_at) as last_activity
            FROM submissions
            WHERE user_id = ?
        `, [userId]);

        conn.release();

        res.json({
            user: users[0],
            stats: submissions[0]
        });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

// Supprimer un utilisateur (pour admin)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const conn = await pool.getConnection();

        // Vérifier si l'utilisateur existe
        const [users] = await conn.query("SELECT id FROM users WHERE id = ?", [userId]);
        
        if (users.length === 0) {
            conn.release();
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Supprimer les soumissions de l'utilisateur
        await conn.query("DELETE FROM submissions WHERE user_id = ?", [userId]);

        // Supprimer l'utilisateur
        await conn.query("DELETE FROM users WHERE id = ?", [userId]);

        conn.release();

        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
