/**
 * controllers/authController.js
 * Login, registo e perfil.
 * Senhas: hash bcrypt (custo 12). JWT expira em 7 dias.
 */

const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User   = require("../models/User");

const COLORS = ["#0EA5A0","#22C55E","#8B5CF6","#F59E0B","#EF4444","#3B82F6","#EC4899","#14B8A6"];
const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

/** Gera JWT com id e role no payload */
function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ── POST /api/auth/register ────────────────────────────
async function register(req, res) {
  try {
    const { name, username, email, password, phone, school } = req.body;

    // Validações básicas
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Preenche todos os campos obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }
    if (username.includes(" ")) {
      return res.status(400).json({ error: "O username não pode ter espaços." });
    }

    // Verificar duplicados
    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "Email" : "Username";
      return res.status(409).json({ error: `${field} já está em uso.` });
    }

    // Hash da senha — nunca guardar em plain text
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone:  phone  || "",
      school: school || "",
      color:  randColor(),
      coins:  20,
      history: [{ icon: "🎁", text: "Bónus de boas-vindas", coins: 20 }],
    });

    const token = signToken(user);

    res.status(201).json({
      token,
      user: user.toJSON(), // toJSON remove password automaticamente
      message: `🎉 Bem-vindo, ${name.split(" ")[0]}! Tens 20 moedas de bónus.`,
    });
  } catch (err) {
    console.error("[register]", err.message);
    res.status(500).json({ error: "Erro ao criar conta. Tenta novamente." });
  }
}

// ── POST /api/auth/login ───────────────────────────────
async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier = username OU email

    if (!identifier || !password) {
      return res.status(400).json({ error: "Username/email e senha são obrigatórios." });
    }

    // Buscar utilizador com a senha (select: false no schema)
    const user = await User.findOne({
      $or: [
        { email:    identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ]
    }).select("+password");

    // Mensagem genérica — não revelar se é o username ou a senha que está errado
    const invalidMsg = "Credenciais incorrectas.";

    if (!user) return res.status(401).json({ error: invalidMsg });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: invalidMsg });

    const token = signToken(user);

    // Devolver sem a senha
    const userObj = user.toJSON();

    res.json({
      token,
      user: userObj,
      message: `✅ Bem-vindo de volta, ${user.name.split(" ")[0]}!`,
    });
  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ error: "Erro ao fazer login. Tenta novamente." });
  }
}

// ── GET /api/auth/me ───────────────────────────────────
async function me(req, res) {
  // req.user já vem do middleware requireAuth
  res.json({ user: req.user });
}

module.exports = { register, login, me };
