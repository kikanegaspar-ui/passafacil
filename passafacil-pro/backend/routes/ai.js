// routes/ai.js
const router = require("express").Router();
const { handleSolve, aiLimiter } = require("../controllers/aiController");
const { requireAuth }            = require("../middleware/auth");

// Rate limit extra para IA + autenticação obrigatória
router.post("/solve", aiLimiter, requireAuth, handleSolve);

module.exports = router;
