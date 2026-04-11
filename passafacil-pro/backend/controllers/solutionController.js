/**
 * controllers/solutionController.js
 * CRUD de resoluções + votação.
 * A moderação IA acontece no backend, nunca no cliente.
 */

const Solution = require("../models/Solution");
const User     = require("../models/User");
const { moderateWithAI } = require("./aiController");

// ── GET /api/solutions ─────────────────────────────────
// Lista resoluções aprovadas (pública)
async function listApproved(req, res) {
  try {
    const { discipline, page = 1, limit = 20 } = req.query;
    const filter = { status: "approved" };
    if (discipline && discipline !== "Todos") filter.discipline = discipline;

    const solutions = await Solution.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Solution.countDocuments(filter);

    res.json({ solutions, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar resoluções." });
  }
}

// ── POST /api/solutions ────────────────────────────────
// Submeter nova resolução (requer auth)
async function submit(req, res) {
  try {
    const { question, answer, discipline } = req.body;
    const user = req.user;

    if (!question?.trim() || !answer?.trim() || !discipline) {
      return res.status(400).json({ error: "Preenche todos os campos." });
    }
    if (answer.trim().length < 30) {
      return res.status(400).json({ error: "Resolução muito curta. Mostra os passos!" });
    }

    // Moderação automática por IA (acontece no backend)
    let verdict = { score: 60, verdict: "PARCIAL", feedback: "Aguarda revisão manual.", tip: "" };
    try {
      verdict = await moderateWithAI(question, answer, discipline);
    } catch (aiErr) {
      console.error("[submit] Erro IA:", aiErr.message);
      // Continua sem IA — vai para moderação manual
    }

    const coinReward = verdict.score >= 90 ? 100 : verdict.score >= 70 ? 50 : 0;
    const status     = verdict.score >= 70 ? "approved" : "pending";

    const solution = await Solution.create({
      userId:     user._id,
      userName:   user.name,
      userColor:  user.color,
      discipline,
      question:   question.trim(),
      answer:     answer.trim(),
      aiScore:    verdict.score,
      aiFeedback: verdict.feedback,
      aiVerdict:  verdict.verdict,
      status,
      coins: coinReward,
    });

    // Atribuir moedas se aprovada automaticamente
    if (coinReward > 0) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { coins: coinReward },
        $push: {
          history: {
            icon:  "✅",
            text:  `Resolução aprovada em ${discipline}`,
            coins: coinReward,
          }
        }
      });
    }

    res.status(201).json({
      solution,
      message: coinReward > 0
        ? `🎉 Aprovada! +${coinReward} moedas! Score IA: ${verdict.score}%`
        : `📤 Enviada! Score IA: ${verdict.score}%. Aguarda revisão.`,
      coinsEarned: coinReward,
    });
  } catch (err) {
    console.error("[submit]", err.message);
    res.status(500).json({ error: "Erro ao submeter resolução." });
  }
}

// ── POST /api/solutions/:id/vote ───────────────────────
// Votar numa resolução aprovada (requer auth, 1 voto por user)
async function vote(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const solution = await Solution.findById(id);
    if (!solution) return res.status(404).json({ error: "Resolução não encontrada." });
    if (solution.status !== "approved") return res.status(400).json({ error: "Só podes votar em resoluções aprovadas." });
    if (solution.userId.equals(userId)) return res.status(400).json({ error: "Não podes votar na tua própria resolução." });
    if (solution.votedBy.some(v => v.equals(userId))) {
      return res.status(409).json({ error: "Já votaste nesta resolução." });
    }

    solution.votes += 1;
    solution.votedBy.push(userId);
    await solution.save();

    res.json({ votes: solution.votes, message: "👍 Voto registado!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao registar voto." });
  }
}

module.exports = { listApproved, submit, vote };
