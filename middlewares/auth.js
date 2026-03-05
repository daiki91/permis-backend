const jwt = require("jsonwebtoken");

// Middleware pour authentifier les utilisateurs
exports.authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token non fourni" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        
        if (decoded.type !== "user") {
            return res.status(403).json({ message: "Token d'administrateur fourni" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expiré" });
    }
};

// Middleware pour authentifier les administrateurs
exports.authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token non fourni" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        
        if (decoded.type !== "admin") {
            return res.status(403).json({ message: "Accès administrateur requis" });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expiré" });
    }
};
