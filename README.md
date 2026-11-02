# Zera

Aplicação web para acompanhar equipamentos eletrônicos, do cadastro ao descarte.

Painel: https://gestao.zeratech.online · QA: https://qa.zeratech.online

A landing page e o cadastro por servlets continuam em https://www.zeratech.online (`Projeto-Zera`). Os dominios so ficam disponiveis apos DNS, TLS e rollout; confira [k8s/README.md](k8s/README.md).

## Rodar localmente

1. `git clone https://github.com/zera-interdisciplinar/zera-web-app.git`
2. `cd zera-web-app` e `npm install`
3. Copie `.env.example` para `.env` e preencha `ZERA_APP_API_KEY` (chave do gateway, fornecida pelo time)
4. `npm run dev` (porta padrão 5173)

O login e os dados dependem do ambiente de testes das APIs (`https://www.zeratech.online/qa/...`) e da chave acima: o navegador só chama `/api/<serviço>` e o proxy da aplicação injeta a chave.

Rotas: `/login`, `/` (painel), `/itens`, `/itens/:id` e `/modelos`. A capacidade e a ocupação ficam em “Gestão do estoque”, dentro de Itens; `/configuracoes` redireciona para Itens.

O gestor acompanha, edita e avalia os itens cadastrados pelos funcionários; o cadastro de itens não está disponível na interface do gestor. A lista permite múltiplos status e categorias, aplicados em conjunto e preservados na URL. Para múltiplas seleções, a camada de serviços lê todas as páginas necessárias antes de combinar os resultados e paginar a lista.
A reformulação para um painel exclusivo do gestor está especificada em [docs/specs/web-manager-refactor.md](docs/specs/web-manager-refactor.md).

As contas de teste são informadas na entrega, não ficam no repositório.

## Estrutura

`src/components/<Nome>/index.tsx` e `src/pages/<Nome>/index.tsx` (um por pasta), `hooks/`, `context/`, `reducers/`, `services/` (única camada com `fetch`, um arquivo por recurso), `types/` (entidades e props), `utils/` (validação, schemas da API, formatação, `localStorage` versionado). Estilos em `styles/` e imagens em `assets/`: dentro de `src/` só há `.ts` e `.tsx`. As regras de dependência entre as pastas são checadas por `npm run check`.

## Verificações

`npm run check` (estrutura e fronteiras entre camadas), `npm run lint`, `npm run test:coverage` (mínimo de 80 % das linhas em `src/services`, `src/utils` e `src/reducers`), `npm run build` e `npm run test:e2e`. O workflow [ci.yml](.github/workflows/ci.yml) roda todas elas; ele valida e e reutilizado pelo deploy. O [deploy-web.yml](.github/workflows/deploy-web.yml) publica QA no push para `qa` e producao em uma GitHub Release publicada (sem prerelease).

## Publicação (cluster)

O painel usa o mesmo GKE/Kong dos microsservicos. [k8s/README.md](k8s/README.md) documenta dominios, Secret, pipelines, verificacoes e rollback.

- `npm run build` gera `dist/`; `npm start` serve o build e o proxy juntos na porta 8080.
- `Dockerfile` faz o build sem segredos e roda somente o servidor e os arquivos estaticos.
- O navegador chama `/api/administrative`, `/api/inventory` e `/api/analytics`. O servidor injeta a chave do gateway e preserva JWT/SSE.
- Push em `qa` publica QA; publicar uma GitHub Release estavel com commit de `main` publica producao. Push em `main` ou uma tag isolada nao publica.
- Ingress, HTTPS e renovacao de certificados ficam no `infra-gtw-kong`. O DNS e administrado no Cloudflare.

## Publicação (GitHub Pages)

O mesmo painel também é publicado em https://zera-interdisciplinar.github.io/zera-web-app/ pelo workflow [pages.yml](.github/workflows/pages.yml) (push na `main`). Ele é independente do deploy do GKE.

O Pages publica **somente produção**: a chave do gateway não vai para o navegador, então as chamadas de API vão, por URL absoluta, para o proxy de produção do cluster (`gestao.zeratech.online`), que já guarda a chave. O QA não usa o Pages.

Configuração única no GitHub:

1. **Settings → Pages → Source:** `GitHub Actions`.
2. **Settings → Secrets and variables → Actions → Variables:** `VITE_ADMIN_API_URL`, `VITE_INVENTORY_API_URL` e `VITE_API_BASE_URL`, com `https://gestao.zeratech.online/api/administrative`, `https://gestao.zeratech.online/api/inventory` e `https://gestao.zeratech.online/api/analytics`. O build falha, com uma mensagem clara, se alguma estiver vazia ou não for https.

Do lado do cluster nada fica manual: `https://zera-interdisciplinar.github.io` já está em `ZERA_WEB_ORIGINS` do overlay de produção ([k8s/overlays/production](k8s/overlays/production/kustomization.yaml)), e vale a partir da próxima GitHub Release publicada (que é o que publica produção). Até lá o Pages abre, mas o login falha por CORS.

No build do Pages o app é gerado com `--base=/<repositório>/`; `404.html` é uma cópia de `index.html` (assim o F5 em `/itens` funciona) e `.nojekyll` evita o processamento do Jekyll. Rodar o mesmo comando localmente: `npm run build -- --base=/zera-web-app/ && node scripts/prepare-pages.mjs`.
