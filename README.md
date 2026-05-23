# 🌾 AgroMercado Angola

Mercado digital para pecuária e avicultura — MVP construído com Flask + SQLAlchemy + Tailwind CSS.

---

## Estrutura do Projecto

```
agro_market/
├── run.py                        # Entry point
├── requirements.txt
├── instance/                     # SQLite database (auto-criado)
│   └── agro_market.db
└── app/
    ├── __init__.py               # Application factory
    ├── models.py                 # SQLAlchemy models
    ├── blueprints/
    │   ├── auth.py               # Registo / Login / Logout
    │   ├── buyer.py              # Marketplace público + API search
    │   └── seller.py             # Dashboard do vendedor (CRUD)
    ├── static/
    │   └── js/
    │       ├── search.js         # Autocomplete live search
    │       └── dashboard.js      # Toggle + delete async
    └── templates/
        ├── base.html
        ├── auth/
        │   ├── login.html
        │   └── register.html
        ├── buyer/
        │   ├── index.html
        │   ├── products.html
        │   ├── product_detail.html
        │   └── _product_card.html
        ├── seller/
        │   ├── dashboard.html
        │   ├── product_form.html
        │   └── profile.html
        └── errors/
            ├── 404.html
            ├── 500.html
            └── 413.html
```

---

## Configuração Rápida

### 1. Clonar / extrair o projecto

```bash
cd agro_market
```

### 2. Criar ambiente virtual

```bash
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows
venv\Scripts\activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Arrancar o servidor

```bash
python run.py
```

Abra `http://localhost:5000` no browser.

A base de dados SQLite e as categorias padrão são criadas automaticamente na primeira execução.

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

## Variáveis de Ambiente (Produção)

```bash
export SECRET_KEY="uma-chave-secreta-muito-longa-e-aleatoria"
```

## Produção com Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 "run:app"
```
