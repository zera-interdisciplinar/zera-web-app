# Zera

Aplicação web para acompanhar equipamentos eletrônicos, do cadastro ao descarte.

[Vercel](https://zera-web-app-kappa.vercel.app) · [GitHub Pages](https://zera-interdisciplinar.github.io/zera-web-app/)

## Rodar localmente

1. `git clone https://github.com/zera-interdisciplinar/zera-web-app.git`
2. `cd zera-web-app` e `npm install`
3. Copie `.env.example` para `.env`
4. `npm run dev` (porta padrão 5173)

O login e os dados dependem de o ambiente de testes das APIs estar no ar.

Rotas: `/login`, `/` (painel), `/itens` e `/modelos`.
A reformulação para um painel exclusivo do gestor está especificada em [docs/specs/web-manager-refactor.md](docs/specs/web-manager-refactor.md).

As contas de teste são informadas na entrega, não ficam no repositório.
