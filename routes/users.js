const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile } = require("../controllers/usersController");
const { authenticateUser } = require("../middlewares/auth");

// Routes publiques
router.post("/register", register);
router.post("/login", login);

// Routes protégées
router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);

module.exports = router;