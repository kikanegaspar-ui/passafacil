/**
 * controllers/aiController.js
 * TODA a comunicação com a API Gemini acontece AQUI.
 * O frontend NUNCA chama a Gemini directamente.
 * A API KEY está apenas no .env do servidor.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require("express-rate-limit");

// Cliente Gemini — inicializado com a chave do ambiente
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limit específico para endpoints de IA (mais restrito — custa dinheiro)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minuto
  max:      10,                 // máximo 10 chamadas IA por minuto por IP
  message:  { error: "Muitos pedidos à IA. Aguarda um momento." },
});

/** Chamada base ao Gemini */
async function callGemini(systemPrompt, userMessage, maxTokens = 900) {
 const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
  const response = await model.generateContent(`${systemPrompt}\n\n---\n\n${userMessage}`);
  return response.response.text() || "";
}

/**
 * Resolve exercício com explicação passo a passo.
 * Usada internamente e exposta via POST /api/ai/solve
 */
async function solveWithAI(exercise, discipline, level = "12ª Classe") {
  const systemPrompt = `És o professor de ${discipline} do PassaFácil Angola (ensino médio angolano, ${level}).
Resolve exercícios de forma clara e pedagógica em português angolano.
Formato EXACTO:

📝 ENUNCIADO
[repetição breve]

🔍 DADOS
[variáveis e valores]

📐 MÉTODO
[fórmulas necessárias]

🔢 RESOLUÇÃO PASSO A PASSO
1. [passo]
2. [passo]
...

✅ RESPOSTA FINAL
[resultado claro]

💡 DICA
[truque para memorizar]`;

  return await callGemini(systemPrompt, exercise, 900);
}

/**
 * Modera resolução de aluno.
 * Retorna objecto { score, verdict, feedback, tip }
 * Usada internamente no solutionController e no adminController.
 */
async function moderateWithAI(question, answer, discipline) {
  const systemPrompt = `És professor rigoroso de ${discipline} do ensino médio angolano.
Avalia a resolução do aluno com rigor académico.
Responde APENAS em JSON puro (sem markdown, sem código, sem explicação):
{"score":0-100,"verdict":"CORRECTO|PARCIAL|INCORRETO","feedback":"1 frase clara","tip":"1 sugestão de melhoria"}`;

  const raw = await callGemini(
    systemPrompt,
    `QUESTÃO: ${question}\nRESPOSTA DO ALUNO: ${answer}`,
    300
  );

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { score: 60, verdict: "PARCIAL", feedback: "Resposta recebida.", tip: "" };
  }
}

// ── POST /api/ai/solve ─────────────────────────────────
// Handler HTTP — requer autenticação
async function handleSolve(req, res) {
  try {
    const { exercise, discipline, level } = req.body;
    const user = req.user;

    if (!exercise?.trim()) {
      return res.status(400).json({ error: "Escreve um exercício primeiro." });
    }
    if (!discipline) {
      return res.status(400).json({ error: "Selecciona uma disciplina." });
    }

    const result = await solveWithAI(exercise.trim(), discipline, level || "12ª Classe");

    // Registar uso no perfil do utilizador
    const User = require("../models/User");
    await User.findByIdAndUpdate(user._id, {
      $inc: { aiUses: 1 },
      $push: {
        history: {
          icon:  "🤖",
          text:  `IA: "${exercise.trim().slice(0, 45)}..."`,
          coins: 0,
        }
      }
    });

    res.json({ result });
  } catch (err) {
    console.error("[ai/solve]", err.message);
    res.status(500).json({ error: "Erro de IA. Verifica a tua ligação e tenta novamente." });
  }
}

// ── POST /api/ai/moderate ──────────────────────────────
// Só para uso interno (adminController). Não exposta directamente.
async function handleModerate(req, res) {
  try {
    const { question, answer, discipline } = req.body;
    if (!question || !answer || !discipline) {
      return res.status(400).json({ error: "Dados insuficientes." });
    }
    const verdict = await moderateWithAI(question, answer, discipline);
    res.json({ verdict });
  } catch (err) {
    console.error("[ai/moderate]", err.message);
    res.status(500).json({ error: "Erro na moderação IA." });
  }
}

module.exports = { handleSolve, handleModerate, solveWithAI, moderateWithAI, aiLimiter };
