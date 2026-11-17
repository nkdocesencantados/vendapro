# VendaPro

Sistema de gestão de vendas para lojas físicas (vendas, estoque, caixa, equipe, comissões, recibos e relatórios). Projeto da HAUX WEB.

- Contexto para quem desenvolve (e para o Claude): [CLAUDE.md](CLAUDE.md)
- Identidade visual: [DESIGN.md](DESIGN.md)
- Guia de textos: [TEXTO.md](TEXTO.md)

## Rodar localmente
```
npm install
cp apps/api/.env.example apps/api/.env   # ajuste DATABASE_URL e segredos
npm run db:seed
npm run dev
```
- API: http://localhost:3001 (docs em /api/docs)
- Web: http://localhost:3000

## Primeiro acesso
O usuário administrador é criado pelo seed. Defina a senha inicial no seed/ambiente e troque no primeiro login. Não registre senhas neste arquivo.

## Deploy
Railway, automático a cada push na branch `main`.
