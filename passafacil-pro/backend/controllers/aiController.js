/**
 * controllers/aiController.js
 * Usa Groq (LLaMA 3) — rápido e gratuito.
 */

const Groq   = require("groq-sdk");
const rateLimit = require("express-rate-limit");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message:  { error: "Muitos pedidos à IA. Aguarda um momento." },
});

async function callGroq(systemPrompt, userMessage, maxTokens = 900) {
  const response = await groq.chat.completions.create({
   model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userMessage  },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

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

  return await callGroq(systemPrompt, exercise, 900);
}

async function moderateWithAI(question, answer, discipline) {
  const systemPrompt = `És professor rigoroso de ${discipline} do ensino médio angolano.
Avalia a resolução do aluno com rigor académico.
Responde APENAS em JSON puro (sem markdown, sem código, sem explicação):
{"score":0-100,"verdict":"CORRECTO|PARCIAL|INCORRETO","feedback":"1 frase clara","tip":"1 sugestão de melhoria"}`;

  const raw = await callGroq(
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
