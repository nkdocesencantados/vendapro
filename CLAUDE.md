# CLAUDE.md — contexto do projeto VendaPro

Leia este arquivo primeiro. Para visual veja `DESIGN.md`; para textos da interface veja `TEXTO.md`.

## O que é
VendaPro: sistema SaaS de gestão de vendas para lojas físicas (vendas, estoque, caixa, equipe, comissões, recibos, relatórios). Faz parte da empresa **HAUX WEB**.

## Stack
- `apps/web`: Next.js 14 (App Router, componentes client), Tailwind + `globals.css` com design system próprio, Zustand (auth), axios (`src/lib/api.ts`), recharts (gráficos), jsPDF, qrcode (QR PIX).
- `apps/api`: NestJS + PostgreSQL. Módulos em `src/modules`: auth, companies, customers, employees, financial, goals, products, receivables (fiado), reports, sales, scheduler, stock, stores, users. Todo dado é filtrado pelo `storeId` do usuário logado.
- Deploy: Railway, automático a cada push na `main`. **Nunca dar push direto na `main` sem o dono aprovar.** Trabalhe em branch e abra pull request.

## Comandos
- `npm install` na raiz (workspaces); `npm run dev` sobe API (3001) e web (3000).
- `npm run build:web` / `build:api`; `npm run db:seed`.
- Antes de commitar mudanças no web: `cd apps/web && npx tsc --noEmit && npx next build`.
- API precisa de `apps/api/.env` (copie de `.env.example`). Nunca commitar `.env`. `JWT_SECRET` é obrigatório: sem ele a API não sobe.
- Em produção `synchronize` é falso: mudança de schema exige SQL em `apps/api/migrations-manual/` rodado no banco antes do deploy.

## Regras
- Idioma da interface: português do Brasil.
- Cores só por variáveis CSS (`--brand`, `--brand-deep`, `--brand-glow`, `--bg`, `--surface`, `--border`, `--text`…). Nunca fixar cor de marca no código.
- A paleta é escolhida por loja: salva no backend (campo `palette`) e em `localStorage` (`vp-palette`). Ids: emerald (padrão, Verde Haux), amber, crimson, violet, ocean, indigo, rose, ouro, graphite. Definidas em `dashboard/layout.tsx` e `dashboard/settings/page.tsx`.
- Preferências do usuário no navegador usam prefixo `vp-` (ex.: `vp-dash-hidden` guarda os blocos ocultos do Resumo).
- Não colocar senhas, tokens ou chaves em arquivos versionados.

## Mapa rápido do web
- `src/app/(auth)/login`: login com vídeo em loop da árvore Haux (`public/brand/login-hero.*`, gerado em `brand-video/` com Remotion: `npm run render`).
- `src/app/dashboard`: layout (menu, topo, paletas), `page.tsx` (Resumo), `sales`, `customers`, `receivables` (Fiado), `pix` (Cobrar com PIX), `inventory`, `cash`, `team`, `commissions`, `receipts`, `reports`, `settings`.
- `src/lib/pix.ts`: gera o PIX copia e cola (BR Code do Banco Central) e links de WhatsApp; autoteste `pixSelfTest()`.
- `src/app/superadmin`: painel do administrador da plataforma.
- `public/brand/haux-emblem.png`: emblema da Haux (recorte provisório; trocar pela logo original).

## Pendências conhecidas
- Relatórios: aplicar o layout novo (abas Produtos/Pagamentos/Horários, botões Excel/PDF em destaque); ranking de vendedores e top produtos moram aqui.
- Aba Equipe: reestruturar; validar tela do Caixa no celular; sino de notificações com dados reais.
- Campos reais em `/reports/advanced` (maior venda, taxa de cancelamento, dias ativos).
- Login 3D em WebGL (three.js) como evolução opcional.
