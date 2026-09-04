# Controle de Gastos de TI - Biodinamica

Painel interno para acompanhar assinaturas e ferramentas de TI da Biodinamica:
gasto mensal/anual, proximos vencimentos e cadastro das assinaturas.

- **Sem banco de dados externo**: os dados ficam em um arquivo JSON no servidor
  (`server/data/subscriptions.json`).
- **Autenticacao propria** (sem Supabase/Auth0): usuario e senha com hash
  bcrypt, sessao via cookie JWT httpOnly.
- **Dois perfis**:
  - `diretoria` - somente visualizacao.
  - `admin_ti` - visualizacao + adicionar/editar/excluir assinaturas.
- **Tema claro e escuro** com toggle manual (persistido no navegador).

## Estrutura

```
server/   API Node.js/Express + dados JSON + autenticacao
client/   Painel React + Vite + Tailwind + shadcn/ui
```

## Rodando localmente

### 1. Servidor (API)

```
cd server
npm install
npm run seed              # cria server/data/subscriptions.json a partir da planilha
npm run create-user -- dono.empresa diretoria --name "Diretoria"
npm run create-user -- admin.ti admin_ti --name "Admin TI"
npm run dev                # http://localhost:4000
```

O comando `create-user` gera uma senha forte aleatoria e mostra uma unica vez no
terminal (anote e guarde com seguranca). Para definir sua propria senha:

```
npm run create-user -- meu.usuario admin_ti --name "Nome" --password "minha-senha-forte"
```

Copie `.env.example` para `.env` e ajuste `JWT_SECRET` (use um valor longo e
aleatorio, principalmente em producao).

### 2. Cliente (painel)

Em outro terminal:

```
cd client
npm install
npm run dev                # http://localhost:5173
```

O Vite faz proxy de `/api` para `http://localhost:4000` automaticamente em
desenvolvimento (ver `client/vite.config.ts`).

## Deploy em um host (ex: VPS Hostinger)

O servidor Node serve tanto a API quanto os arquivos estaticos do painel:

```
cd client && npm install && npm run build     # gera client/dist
cd ../server && npm install
# configurar .env em producao: NODE_ENV=production, JWT_SECRET forte, PORT
npm start                                       # serve API + client/dist na mesma porta
```

Como o app roda como um unico processo Node com persistencia em arquivo, ele
funciona em qualquer VPS/host com Node.js (ex: a VPS Hostinger ja usada pela
empresa). Nao funciona em hosts serverless com filesystem efemero (ex:
Vercel/Netlify functions), pois os dados sao gravados em disco.

Pontos de atencao para producao:

- Sirva atras de HTTPS (o cookie de sessao usa `secure` quando `NODE_ENV=production`).
- Faça backup periodico de `server/data/subscriptions.json` e `server/data/users.json`.
- Gere um `JWT_SECRET` novo e forte (nao reaproveite o de desenvolvimento).
- Para trocar/recuperar uma senha, rode `npm run create-user -- <usuario> <papel>` de novo.

## Dados

O arquivo `Pianel Pagamento Diretoria.xlsx` na raiz foi a fonte inicial dos
dados (normalizados em `server/scripts/seed.js`). Depois do primeiro `npm run
seed`, toda edicao passa a ser feita pelo painel (perfil Admin TI).
