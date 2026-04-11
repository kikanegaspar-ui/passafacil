// routes/solutions.js
const router = require("express").Router();
const { listApproved, submit, vote } = require("../controllers/solutionController");
const { requireAuth, optionalAuth }  = require("../middleware/auth");

router.get("/",           optionalAuth, listApproved); // pública, mas regista user se autenticado
router.post("/",          requireAuth,  submit);
router.post("/:id/vote",  requireAuth,  vote);

module.exports = router;
