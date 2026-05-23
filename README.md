# 🌾 AgroMercado Angola

Mercado digital para pecuária e avicultura — MVP construído com Flask + SQLAlchemy + Tailwind CSS.

---

## Colocar Online (Render.com) — Gratuito

1. Faça upload do projecto para o **GitHub**
2. Crie conta em **render.com**
3. Clique em **New → Web Service**
4. Ligue ao repositório GitHub
5. O Render detecta o `render.yaml` automaticamente
6. Clique **Deploy** — pronto! ✅

O site fica disponível em:
`https://agro-mercado-angola.onrender.com`

---

## Configuração Local

```bash
# 1. Criar ambiente virtual
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Arrancar
python run.py
# → http://localhost:5000
```

---

## Estrutura do Projecto

```
agro_market/
├── run.py                        # Entry point
├── requirements.txt
├── Procfile                      # Para o Render.com
├── render.yaml                   # Configuração automática Render
├── instance/                     # SQLite database (auto-criado)
│   └── agro_market.db
└── app/
    ├── __init__.py               # Application factory
    ├── models.py                 # SQLAlchemy models
    ├── blueprints/
    │   ├── auth.py               # Registo / Login / Logout
    │   ├── buyer.py              # Marketplace público + API search
    │   └── seller.py             # Dashboard do vendedor (CRUD)
    ├── static/js/
    │   ├── search.js             # Autocomplete live search
    │   └── dashboard.js          # Toggle + delete async
    └── templates/
        ├── base.html
        ├── auth/
        ├── buyer/
        ├── seller/
        └── errors/
```

---

## Funcionalidades MVP

| Funcionalidade | Detalhe |
|---|---|
| Registo / Login | RBAC: Comprador vs Vendedor |
| Dashboard Vendedor | CRUD completo de produtos |
| Feed Comprador | Pesquisa + filtro por categoria |
| Detalhe do Produto | Botão WhatsApp com mensagem pré-preenchida |
| Pesquisa Live | Autocomplete via Fetch API |
| Toggles AJAX | Activar/desactivar produtos sem reload |
| Páginas de erro | 404 / 500 / 413 personalizadas |
| Mobile-first | Totalmente responsivo |

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `SECRET_KEY` | Chave secreta Flask (gerada automaticamente no Render) |
| `FLASK_ENV` | `production` ou `development` |
| `PORT` | Porta do servidor (gerida automaticamente pelo Render) |
