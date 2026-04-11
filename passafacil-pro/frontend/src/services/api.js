/**
 * services/api.js
 * Camada de serviço — TODAS as chamadas ao backend passam aqui.
 * O frontend NUNCA chama a Gemini nem qualquer API externa directamente.
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/** Lê o token JWT do localStorage */
function getToken() {
  return localStorage.getItem("pf_token");
}

/** Guarda token e utilizador */
export function saveSession(token, user) {
  localStorage.setItem("pf_token", token);
  localStorage.setItem("pf_user",  JSON.stringify(user));
}

/** Limpa sessão */
export function clearSession() {
  localStorage.removeItem("pf_token");
  localStorage.removeItem("pf_user");
}

/** Lê utilizador guardado localmente */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem("pf_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Função base para todos os pedidos HTTP.
 * Anexa o token JWT automaticamente se existir.
 */
async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token   = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res  = await fetch(`${BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro desconhecido.");
  }
  return data;
}

// ── AUTH ───────────────────────────────────────────────
export const authAPI = {
  register: (body) => request("POST", "/auth/register", body),
  login:    (body) => request("POST", "/auth/login",    body),
  me:       ()     => request("GET",  "/auth/me"),
};

// ── IA — o frontend pede ao backend, nunca à Gemini ───
export const aiAPI = {
  solve: (exercise, discipline, level) =>
    request("POST", "/ai/solve", { exercise, discipline, level }),
};

// ── RESOLUÇÕES ─────────────────────────────────────────
export const solutionAPI = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/solutions${qs ? "?" + qs : ""}`);
  },
  submit: (body)  => request("POST", "/solutions",        body),
  vote:   (id)    => request("POST", `/solutions/${id}/vote`),
};

// ── UTILIZADORES ───────────────────────────────────────
export const userAPI = {
  ranking: () => request("GET", "/users/ranking"),
  profile: () => request("GET", "/users/profile"),
};
