# PassaFácil PRO — Arquitectura Completa

## 📁 Estrutura de Pastas

```
passafacil/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Login, registo, JWT
│   │   ├── solutionController.js   # CRUD resoluções + votação
│   │   ├── aiController.js         # Gemini API (NUNCA no frontend)
│   │   └── adminController.js      # Moderação (role admin obrigatório)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── solutions.js
│   │   ├── ai.js
│   │   ├── users.js
│   │   └── admin.js                # Protegido por requireAuth + requireAdmin
│   ├── models/
│   │   ├── User.js                 # Schema com password select:false
│   │   └── Solution.js
│   ├── middleware/
│   │   └── auth.js                 # requireAuth, requireAdmin, optionalAuth
│   ├── server.js                   # Entry point Express
│   ├── .env                        # NUNCA commitar para Git
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── services/
    │   │   └── api.js              # Único ponto de contacto com o backend
    │   ├── App.jsx                 # UI limpa — sem API keys, sem admin
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── .env
    └── package.json
```

---

## 🚀 Como Correr

### 1. Pré-requisitos
- Node.js 18+
- MongoDB (local ou MongoDB Atlas)

### 2. Backend

```bash
cd backend
npm install

# Editar o ficheiro .env:
#   DB_URI=mongodb://localhost:27017/passafacil
#   JWT_SECRET=<gera com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
#   ADMIN_SEED_PASSWORD=<senha forte para o admin>
#   GEMINI_API_KEY=AIzaSyAs9SLyhQedp-t2cNQ9e6Z7JOZgmIhT7TA

npm run dev   # desenvolvimento (nodemon)
npm start     # produção
```

O servidor arranca em **http://localhost:4000**

### 3. Frontend

```bash
cd frontend
npm install

# O .env já está configurado para localhost
# Em produção: VITE_API_URL=https://teu-backend.com/api

npm run dev    # http://localhost:3000
npm run build  # gera pasta dist/ para produção
```

---

## 🔒 Segurança Implementada

| Camada | Medida |
|--------|--------|
| Senhas | `bcrypt` com custo 12 — nunca em plain text |
| Auth | JWT com expiração 7 dias |
| Admin | Middleware `requireAdmin` verifica role na DB |
| API Keys | Apenas no `.env` do servidor — nunca no frontend |
| Rate limit | 100 req/15min global, 20 req/15min auth, 10 req/min IA |
| Headers | `helmet` define cabeçalhos seguros automaticamente |
| CORS | Apenas o domínio do frontend |
| Senhas na API | `select: false` no schema — nunca devolvidas |

---

## 🌐 Endpoints da API

### Públicos
```
GET  /api/health
GET  /api/solutions          # resoluções aprovadas
GET  /api/users/ranking      # top 10
```

### Autenticados (JWT obrigatório)
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/solutions          # submeter resolução
POST /api/solutions/:id/vote
POST /api/ai/solve           # resolver com Gemini
GET  /api/users/profile
```

### Admin (JWT + role:"admin")
```
GET   /api/admin/solutions
PATCH /api/admin/solutions/:id        # aprovar/rejeitar
POST  /api/admin/solutions/:id/reverify  # reavaliar com IA
GET   /api/admin/stats
GET   /api/admin/users
```

---

## 🏭 Produção

### Backend (ex: Railway, Render, VPS)
```bash
# Variáveis de ambiente no painel do hosting:
NODE_ENV=production
DB_URI=mongodb+srv://...
JWT_SECRET=<segredo de 64 chars>
GEMINI_API_KEY=...
FRONTEND_URL=https://teu-frontend.com
ADMIN_SEED_PASSWORD=<senha forte>
```

### Frontend (ex: Vercel, Netlify)
```bash
# Variável de ambiente:
VITE_API_URL=https://teu-backend.com/api
```

---

## ⚠️ Checklist de Segurança antes de ir para Produção

- [ ] Alterar `ADMIN_SEED_PASSWORD` no `.env`
- [ ] Gerar `JWT_SECRET` aleatório (mínimo 64 chars)
- [ ] Nunca commitar `.env` para Git (está no `.gitignore`)
- [ ] Activar HTTPS no backend
- [ ] Configurar `FRONTEND_URL` correctamente no CORS
- [ ] Activar autenticação no MongoDB Atlas
- [ ] Considerar adicionar refresh tokens para sessões longas
