// routes/users.js
const router = require("express").Router();
const User   = require("../models/User");
const { requireAuth } = require("../middleware/auth");

// GET /api/users/ranking — top 10 por moedas (pública)
router.get("/ranking", async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .sort({ coins: -1 })
      .limit(10)
      .select("name username color coins");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar ranking." });
  }
});

// GET /api/users/profile — perfil do utilizador autenticado
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar perfil." });
  }
});

module.exports = router;
