// routes/admin.js
// TODAS as rotas aqui exigem role "admin".
// O frontend principal não conhece estas rotas.
const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  listSolutions,
  moderateSolution,
  reverify,
  getStats,
  listUsers,
} = require("../controllers/adminController");

// Aplicar ambos os middlewares a TODAS as rotas deste router
router.use(requireAuth, requireAdmin);

router.get("/solutions",          listSolutions);
router.patch("/solutions/:id",    moderateSolution);
router.post("/solutions/:id/reverify", reverify);
router.get("/stats",              getStats);
router.get("/users",              listUsers);

module.exports = router;
