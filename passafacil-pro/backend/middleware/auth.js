/**
 * middleware/auth.js
 * Middlewares de autenticação e autorização por role.
 * Todos os erros retornam 401 ou 403 sem revelar detalhes internos.
 */

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/**
 * requireAuth — verifica JWT e anexa req.user
 * Uso: router.get("/rota", requireAuth, handler)
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }

    const token = header.slice(7); // remover "Bearer "
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar utilizador fresco (garante que não foi banido/eliminado)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Utilizador não encontrado." });
    }

    req.user = user;
    next();
  } catch (err) {
    // jwt.verify lança erro se token inválido/expirado
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

/**
 * requireAdmin — verifica que o utilizador tem role "admin"
 * Deve ser usado DEPOIS de requireAuth.
 * Uso: router.get("/admin/rota", requireAuth, requireAdmin, handler)
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    // 403 Forbidden — não revelar que a rota existe
    return res.status(403).json({ error: "Acesso negado." });
  }
  next();
}

/**
 * optionalAuth — tenta autenticar mas não bloqueia se não houver token.
 * Útil para rotas públicas que têm comportamento diferente se autenticado.
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next();
    const token   = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;
  } catch {}
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
