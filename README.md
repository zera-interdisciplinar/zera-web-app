# Zera

Gestão de equipamentos eletrônicos, do cadastro ao descarte.

Equipamentos esquecidos no estoque ocupam espaço e dificultam o reaproveitamento. O Zera reúne o inventário da unidade e ajuda nossa equipe a acompanhar o destino de cada item.

A gente cadastra categorias e modelos, registra os itens e acompanha suas aprovações e movimentações. O painel apresenta os indicadores disponíveis da unidade. A busca por locais de reciclagem ajuda a planejar os descartes.

Funcionários acompanham os itens que cadastraram. Gestores consultam o inventário da unidade, criam categorias e acompanham os responsáveis pelos cadastros. A autorização de cada operação também depende dos serviços configurados.

## Desenvolvimento

Usamos React 19, TypeScript, Vite, React Router e CSS Modules. Os testes usam Vitest e Playwright.

Com Node.js 22.12 ou superior, copie `.env.example` para `.env` e configure os serviços. Instale as dependências com `npm ci` e inicie com `npm run dev`.

Para conferir uma alteração, execute `npm run lint`, `npm test` e `npm run build`. Os fluxos de navegador ficam em `npm run test:e2e`.

As telas estão em `src/pages`, os componentes em `src/components` e o acesso aos serviços em `src/services`. Os estilos ficam em `styles`; os testes, em `tests` e `e2e`. A pasta `server` reúne o proxy usado no desenvolvimento e pelas funções de publicação.

## Publicação

[Zera na Vercel](https://zera-web-app-kappa.vercel.app) · [Zera no GitHub Pages](https://zera-interdisciplinar.github.io/zera-web-app/).

O Pages usa o proxy HTTPS publicado na Vercel. A chave dos serviços fica somente no servidor; as bases públicas são configuradas no ambiente de publicação.

Feito por [EnzoCasares](https://github.com/EnzoCasares).
