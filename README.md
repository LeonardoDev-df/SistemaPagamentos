# SisPag - Sistema de Controle de Pagamentos VR/VA

Sistema para controlar compra/venda de cartões benefício (Vale Refeição e Vale Alimentação).

**Lógica:** Vendedor compra cartão do funcionário cobrando taxa configurável (padrão 15%).
Exemplo: Cartão de R$100 → R$15 fica com vendedor, R$85 devolvido ao funcionário.

---

## Arquitetura

**Monorepo** com pnpm workspaces:

| Pacote | Tecnologia | Descrição |
|--------|-----------|-----------|
| `packages/frontend` | React 19 + Vite 6 + Tailwind 4 | SPA, consome API |
| `packages/backend` | Next.js 15 (App Router) | API routes, lógica de negócio |
| `packages/shared` | TypeScript + Zod | Types, enums, validações |

**Infraestrutura:** Firebase (Firestore + Auth + Storage) + Vercel

---

## Requisitos

- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)
- Projeto Firebase configurado

---

## Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/LeonardoDev-df/SistemaPagamentos.git
cd SistemaPagamentos

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente (ver seção abaixo)

# 4. Rodar em desenvolvimento
pnpm dev              # Roda frontend + backend em paralelo
pnpm dev:frontend     # Só frontend (porta 5173)
pnpm dev:backend      # Só backend (porta 3001)
```

---

## Variáveis de Ambiente

### Backend (`packages/backend/.env.local`)

```env
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=seu-project-id.firebasestorage.app
ENCRYPTION_KEY=64_caracteres_hex
FRONTEND_URL=http://localhost:5173
```

> Gerar ENCRYPTION_KEY: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Frontend (`packages/frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> Os valores do frontend vêm de: Firebase Console → Configurações do projeto → Seus apps → Config

> O `FIREBASE_PRIVATE_KEY` vem do JSON da service account: Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada

---

## Configuração do Firebase Console

### 1. Authentication

1. Firebase Console → **Authentication** → **Sign-in method**
2. Ativar **Email/Senha**
3. Ativar **Google** (preencher email de suporte)
4. Em **Settings** → **Authorized domains**, adicionar:
   - `localhost` (já vem por padrão)
   - Domínio do frontend na Vercel (ex: `sistema-pagamentos-frontend.vercel.app`)

### 2. Firestore Database

1. Firebase Console → **Firestore Database** → **Criar banco de dados**
2. Selecionar localização (ex: `southamerica-east1`)
3. Iniciar em **modo de produção**
4. Copiar as regras do arquivo `firebase/firestore.rules` para o console

### 3. Storage

1. Firebase Console → **Storage** → **Começar**
2. Copiar as regras do arquivo `firebase/storage.rules` para o console

---

## Criar Primeiro Usuário Admin

Após deploy, o primeiro login (email/senha ou Google) cria o usuário como COMPRADOR por padrão.
Para promover a ADMIN, use o Firebase Console:

1. Firestore → collection `users` → encontre seu documento
2. Edite o campo `role` de `"COMPRADOR"` para `"ADMIN"`
3. Faça logout e login novamente no sistema

---

## Rotas da API (Backend)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar usuário (admin) |
| POST | `/api/auth/verify` | Verificar token / criar usuário Google |
| GET/PUT | `/api/auth/profile` | Perfil do usuário logado |
| GET/POST | `/api/users` | Listar / criar usuários |
| GET/PUT/DELETE | `/api/users/[uid]` | Detalhe / editar / deletar usuário |
| GET/POST | `/api/transactions` | Listar / criar transações |
| GET/PUT/DELETE | `/api/transactions/[id]` | Detalhe / editar / deletar transação |
| PUT | `/api/transactions/[id]/status` | Mudar status da transação |
| POST | `/api/transactions/[id]/receipt` | Upload comprovante |
| GET | `/api/transactions/export` | Exportar CSV |
| GET/PUT | `/api/settings` | Configurações do sistema |
| GET | `/api/dashboard` | Dados do dashboard |

---

## Páginas (Frontend)

| Rota | Página | Acesso |
|------|--------|--------|
| `/login` | Login (email + Google) | Público |
| `/` | Dashboard | Admin, Vendedor |
| `/transacoes` | Lista de transações | Admin, Vendedor, Comprador |
| `/transacoes/nova` | Nova transação | Admin, Vendedor |
| `/transacoes/:id` | Detalhe da transação | Admin, Vendedor, Comprador |
| `/usuarios` | Gerenciar usuários | Admin |
| `/configuracoes` | Configurações | Admin |
| `/perfil` | Perfil do usuário | Todos |

---

## Status das Transações (State Machine)

```
COMPRADO → NAO_PAGO | CARTAO_OK | CANCELADO
NAO_PAGO → PAGO | CANCELADO
CARTAO_OK → NAO_PAGO | PAGO
PAGO → (terminal)
CANCELADO → (terminal)
```

---

## Comandos Git

```bash
# Ver status dos arquivos
git status

# Adicionar arquivos modificados
git add .

# Criar commit
git commit -m "descrição da alteração"

# Enviar para o GitHub (dispara deploy automático na Vercel)
git push

# Puxar alterações do GitHub
git pull

# Ver histórico de commits
git log --oneline

# Criar uma branch nova
git checkout -b nome-da-branch

# Voltar para main
git checkout main

# Merge de uma branch
git merge nome-da-branch
```

---

## Deploy na Vercel

O deploy é **automático** a cada `git push` na branch `main`.

### Projeto 1: Backend (Next.js)

**Configuração na Vercel:**

| Campo | Valor |
|-------|-------|
| Framework Preset | Next.js |
| Root Directory | `packages/backend` |
| Build Command | (padrão do Next.js) |
| Output Directory | (padrão do Next.js) |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

**Variáveis de ambiente (Settings → Environment Variables):**

| Variável | Valor |
|----------|-------|
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Email da service account |
| `FIREBASE_PRIVATE_KEY` | Chave privada (ver dica abaixo) |
| `FIREBASE_STORAGE_BUCKET` | Bucket do Storage |
| `ENCRYPTION_KEY` | 64 caracteres hex |
| `FRONTEND_URL` | URL do frontend na Vercel (ex: `https://sistema-pagamentos-frontend.vercel.app`) |

> **FIREBASE_PRIVATE_KEY na Vercel:** Cole o valor SEM aspas ao redor. Começa com `-----BEGIN PRIVATE KEY-----` e termina com `-----END PRIVATE KEY-----\n`. Os `\n` ficam como texto literal — a Vercel converte automaticamente.

### Projeto 2: Frontend (Vite/React)

**Configuração na Vercel:**

| Campo | Valor |
|-------|-------|
| Framework Preset | Vite |
| Root Directory | `packages/frontend` |
| Build Command | `cd ../.. && pnpm install && cd packages/frontend && pnpm build` |
| Output Directory | `dist` |

**Variáveis de ambiente (Settings → Environment Variables):**

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL do backend na Vercel (ex: `https://sistema-pagamentos-backend.vercel.app`) |
| `VITE_FIREBASE_API_KEY` | API Key do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

> **SPA Rewrite:** Se houver erro 404 ao acessar rotas diretamente, crie um arquivo `packages/frontend/vercel.json`:
> ```json
> { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
> ```

### Passo a Passo para Deploy Inicial

```bash
# 1. Certifique-se que o código está commitado e no GitHub
git add .
git commit -m "sua mensagem"
git push

# 2. Acesse https://vercel.com e faça login com sua conta GitHub

# 3. Clique "Add New Project" → importe o repositório SistemaPagamentos

# 4. PRIMEIRO: deploy do BACKEND
#    - Root Directory: packages/backend
#    - Framework: Next.js
#    - Adicione todas as variáveis de ambiente do backend
#    - Clique Deploy

# 5. Copie a URL do backend (ex: https://sistema-pagamentos-backend.vercel.app)

# 6. SEGUNDO: deploy do FRONTEND
#    - Clique "Add New Project" → mesmo repositório
#    - Root Directory: packages/frontend
#    - Framework: Vite
#    - Build Command: cd ../.. && pnpm install && cd packages/frontend && pnpm build
#    - Adicione as variáveis de ambiente do frontend
#    - VITE_API_URL = URL do backend copiada acima
#    - Clique Deploy

# 7. Copie a URL do frontend e:
#    - Atualize FRONTEND_URL no backend (Vercel → Settings → Env Vars)
#    - Adicione o domínio em Firebase Console → Auth → Authorized domains
#    - Redeploy o backend (Vercel → Deployments → último → ⋯ → Redeploy)
```

---

## Roles (Permissões)

| Role | Dashboard | Transações | Nova Transação | Usuários | Configurações |
|------|-----------|------------|----------------|----------|---------------|
| ADMIN | Sim | Todas | Sim | Sim | Sim |
| VENDEDOR | Sim | Próprias | Sim | Não | Não |
| COMPRADOR | Não | Próprias | Não | Não | Não |

---

## Estrutura de Pastas

```
SistemaPagamentos/
├── package.json                  # Scripts do monorepo
├── pnpm-workspace.yaml           # Config do workspace
├── tsconfig.base.json            # TypeScript base
├── .env.example                  # Template de variáveis
├── firebase/
│   ├── firestore.rules           # Regras do Firestore
│   └── storage.rules             # Regras do Storage
└── packages/
    ├── shared/src/               # Tipos e validações compartilhados
    │   ├── enums/                # UserRole, TransactionStatus
    │   ├── types/                # User, Transaction, Settings, API
    │   ├── validation/           # Schemas Zod
    │   └── constants/            # Valores padrão
    ├── backend/src/              # API Next.js
    │   ├── app/api/              # Rotas da API
    │   ├── lib/firebase/         # Firebase Admin SDK
    │   ├── lib/middleware/       # Auth, validação
    │   ├── lib/services/         # Lógica de negócio
    │   └── lib/utils/            # Criptografia, cálculos
    └── frontend/src/             # React SPA
        ├── config/               # Firebase, API, rotas
        ├── contexts/             # AuthContext
        ├── hooks/                # React Query hooks
        ├── components/           # UI, layout, transactions
        ├── pages/                # Páginas da aplicação
        ├── services/             # Chamadas API
        └── utils/                # Formatação, helpers
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Failed to parse private key` | FIREBASE_PRIVATE_KEY mal formatada. Recrie a variável na Vercel sem aspas. |
| `auth/unauthorized-domain` | Adicione o domínio do frontend em Firebase Console → Auth → Authorized domains |
| `auth/operation-not-allowed` | Ative o provedor (Google/Email) em Firebase Console → Auth → Sign-in method |
| Login funciona mas fica na tela de loading | Verifique se VITE_API_URL aponta pro backend correto |
| CORS error | Verifique FRONTEND_URL no backend e redeploy |
| 404 em rotas do frontend | Adicione `vercel.json` com rewrite SPA (ver seção Deploy) |
| `pnpm: command not found` | Instale: `npm install -g pnpm` |
