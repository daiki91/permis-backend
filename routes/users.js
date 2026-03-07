const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, getAllUsers } = require("../controllers/usersController");
const { authenticateUser } = require("../middlewares/auth");

// Routes publiques
router.post("/register", register);
router.post("/login", login);

// Route admin - Obtenir tous les utilisateurs
router.get("/", getAllUsers);

// Routes protégées
router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;