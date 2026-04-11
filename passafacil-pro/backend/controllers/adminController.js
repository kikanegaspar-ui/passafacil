/**
 * controllers/adminController.js
 * Funções de moderação e gestão — só acessíveis com role "admin".
 * O frontend principal NUNCA vê estas rotas.
 */

const Solution = require("../models/Solution");
const User     = require("../models/User");
const { moderateWithAI } = require("./aiController");

// ── GET /api/admin/solutions ───────────────────────────
// Lista todas as resoluções (filtráveis por status)
async function listSolutions(req, res) {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const filter = status === "all" ? {} : { status };

    const solutions = await Solution.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Solution.countDocuments(filter);
    res.json({ solutions, total });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar resoluções." });
  }
}

// ── PATCH /api/admin/solutions/:id ────────────────────
// Aprovar ou rejeitar resolução
async function moderateSolution(req, res) {
  try {
    const { id }     = req.params;
    const { action } = req.body; // "approved" | "rejected"

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Acção inválida." });
    }

    const solution = await Solution.findById(id);
    if (!solution) return res.status(404).json({ error: "Resolução não encontrada." });

    // Calcular moedas com base no score IA
    const coinReward = action === "approved"
      ? (solution.aiScore >= 90 ? 100 : 50)
      : 0;

    solution.status = action;
    solution.coins  = coinReward;
    await solution.save();

    // Atribuir moedas ao aluno se aprovado
    if (action === "approved" && coinReward > 0) {
      await User.findByIdAndUpdate(solution.userId, {
        $inc: { coins: coinReward },
        $push: {
          history: {
            icon:  "✅",
            text:  `Moderador aprovou em ${solution.discipline}`,
            coins: coinReward,
          }
        }
      });
    }

    res.json({
      solution,
      message: action === "approved"
        ? `✅ Aprovado! ${coinReward} moedas atribuídas.`
        : "❌ Resolução rejeitada.",
    });
  } catch (err) {
    console.error("[admin/moderate]", err.message);
    res.status(500).json({ error: "Erro na moderação." });
  }
}

// ── POST /api/admin/solutions/:id/reverify ─────────────
// Reavalia com IA uma resolução já existente
async function reverify(req, res) {
  try {
    const { id } = req.params;
    const solution = await Solution.findById(id);
    if (!solution) return res.status(404).json({ error: "Resolução não encontrada." });

    const verdict = await moderateWithAI(solution.question, solution.answer, solution.discipline);

    solution.aiScore    = verdict.score;
    solution.aiFeedback = verdict.feedback;
    solution.aiVerdict  = verdict.verdict;
    await solution.save();

    res.json({
      solution,
      message: `🤖 Nova pontuação IA: ${verdict.score}%`,
    });
  } catch (err) {
    console.error("[admin/reverify]", err.message);
    res.status(500).json({ error: "Erro na reavaliação IA." });
  }
}

// ── GET /api/admin/stats ───────────────────────────────
// Estatísticas gerais
async function getStats(req, res) {
  try {
    const [totalUsers, totalSolutions, pendingCount, approvedCount] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Solution.countDocuments(),
      Solution.countDocuments({ status: "pending" }),
      Solution.countDocuments({ status: "approved" }),
    ]);

    const topUsers = await User.find({ role: "user" })
      .sort({ coins: -1 })
      .limit(10)
      .select("name username coins");

    res.json({
      users:     totalUsers,
      solutions: totalSolutions,
      pending:   pendingCount,
      approved:  approvedCount,
      topUsers,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar estatísticas." });
  }
}

// ── GET /api/admin/users ───────────────────────────────
// Lista todos os utilizadores (sem passwords)
async function listUsers(req, res) {
  try {
    const users = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar utilizadores." });
  }
}

module.exports = { listSolutions, moderateSolution, reverify, getStats, listUsers };
