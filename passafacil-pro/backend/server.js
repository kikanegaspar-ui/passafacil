/**
 * server.js — PassaFácil PRO
 * Ponto de entrada do servidor Express.
 * Configura middlewares de segurança, rotas e ligação à base de dados.
 */

require("dotenv").config();
const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");

// ── Rotas ──────────────────────────────────────────────
const authRoutes     = require("./routes/auth");
const userRoutes     = require("./routes/users");
const solutionRoutes = require("./routes/solutions");
const aiRoutes       = require("./routes/ai");
const adminRoutes    = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Segurança base ─────────────────────────────────────
// Helmet define cabeçalhos HTTP seguros automaticamente
app.use(helmet());

// CORS: só permite pedidos do frontend oficial
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Parse de JSON nos pedidos
app.use(express.json({ limit: "10kb" }));

// ── Rate limiting global ───────────────────────────────
// Máximo 100 pedidos por IP por 15 minutos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiados pedidos. Tenta mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limit mais restrito para auth (evitar brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiadas tentativas de login. Aguarda 15 minutos." },
});

// ── Montagem das rotas ─────────────────────────────────
app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/solutions", solutionRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/admin",     adminRoutes); // protegido por middleware de role

// ── Rota de health check ───────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Handler de erros global ────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERRO]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production"
      ? "Erro interno do servidor."
      : err.message,
  });
});

// ── Rota 404 ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// ── Ligação MongoDB e arranque ─────────────────────────
mongoose
  .connect(process.env.DB_URI)
  .then(async () => {
    console.log("✅ MongoDB ligado.");
    // Criar utilizador admin inicial se não existir
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao ligar MongoDB:", err.message);
    process.exit(1);
  });

// ── Seed do Admin inicial ──────────────────────────────
async function seedAdmin() {
  const User = require("./models/User");
  const bcrypt = require("bcryptjs");

  const exists = await User.findOne({ role: "admin" });
  if (exists) return; // Já existe um admin

  const hash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || "ChangeMeNow!", 12);
  await User.create({
    name:     "Administrador",
    username: "admin",
    email:    "admin@passafacil.ao",
    password: hash,
    role:     "admin",
    coins:    0,
  });
  console.log("👑 Utilizador admin criado. Altera a senha em produção!");
}
