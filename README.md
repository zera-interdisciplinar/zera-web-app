# Zera

Sistema para acompanhar os equipamentos eletrônicos das empresas e encaminhá-los ao reuso ou descarte correto.

Resíduos eletrônicos se acumulam nas empresas quando falta rastreio e um processo seguro de destinação. O Zera organiza esse ciclo: cadastro de categorias, modelos e itens; aprovação, triagem e manutenção; descartes com peso e destino; cadastro de recicladoras e locais de coleta; e painel de indicadores.

Há dois perfis: **Gestor**, que administra a unidade, e **Funcionário**, que consulta e movimenta os próprios itens.

## Como funciona

O front-end em React e TypeScript conversa com as APIs de identidade, inventário e analytics por um proxy na Vercel. O banco de dados é acessado pelos serviços de API.

O projeto usa Vite, React, TypeScript, React Router, CSS Modules e Recharts. `src/` contém páginas, componentes, serviços e regras da aplicação; `styles/` reúne os estilos; `api/` e `server/` implementam o proxy; `public/` contém arquivos públicos.

## Executar localmente

```sh
git clone https://github.com/zera-interdisciplinar/zera-web-app.git
cd zera-web-app
npm install
npm run dev
```

O acesso depende de o ambiente de testes das APIs estar no ar.

## Publicações

- [Vercel](https://zera-web-app-kappa.vercel.app)
- [GitHub Pages](https://zera-interdisciplinar.github.io/zera-web-app/)

Autor: EnzoCasares. Licença: MIT.
