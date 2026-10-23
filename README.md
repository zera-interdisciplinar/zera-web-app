# Zera

Aplicação web para acompanhar equipamentos eletrônicos, do cadastro ao descarte.

[GitHub Pages](https://zera-interdisciplinar.github.io/zera-web-app/)

## Rodar localmente

1. `git clone https://github.com/zera-interdisciplinar/zera-web-app.git`
2. `cd zera-web-app` e `npm install`
3. Copie `.env.example` para `.env` e preencha `ZERA_APP_API_KEY` (chave do gateway, fornecida pelo time)
4. `npm run dev` (porta padrão 5173)

O login e os dados dependem do ambiente de testes das APIs (`https://www.zeratech.online/qa/...`) e da chave acima: o navegador só chama `/api/<serviço>` e o proxy da aplicação injeta a chave.

Rotas: `/login`, `/` (painel), `/itens` e `/modelos`.
A reformulação para um painel exclusivo do gestor está especificada em [docs/specs/web-manager-refactor.md](docs/specs/web-manager-refactor.md).

As contas de teste são informadas na entrega, não ficam no repositório.
