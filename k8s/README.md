# Deploy do painel no GKE

## Enderecos e eventos

| Ambiente | URL | Namespace | Evento que publica |
|---|---|---|---|
| QA | https://qa.zeratech.online | qa | push na branch `qa` |
| Producao | https://gestao.zeratech.online | production | GitHub Release publicada, sem prerelease, com commit presente em `main` |

A raiz https://www.zeratech.online pertence ao `Projeto-Zera` (landing e servlets). Publicar apenas uma tag nao inicia o deploy de producao. Nenhum push em `main` publica o painel.

## Caminho da requisicao

Navegador -> Cloudflare -> Kong -> `zera-web-app:80` -> Node:8080.
O Node entrega `dist/` e encaminha somente as rotas permitidas em `/api/{administrative,inventory,analytics}`. A chave fica no Secret existente `mobile-app-key-auth-secret`, campo `key`, injetada no processo; nao e argumento de build nem `VITE_*`.

O overlay de QA aponta exclusivamente a `/qa/administrative`, `/qa/inventory` e `/qa/analytics` no gateway. O de producao usa os prefixos sem `/qa`. O proxy preserva o JWT e `X-Unit-Id`; SSE segue sem buffering. Liveness/readiness conferem o servidor local, sem reiniciar o painel por uma falha transitoria de API.

## Pre-requisitos

- Projeto `zera-512810`, cluster `zera-cluster`, regiao `southamerica-east1`, Artifact Registry `repo`.
- Provider WIF `projects/659911714707/locations/global/workloadIdentityPools/zera-pool/providers/github-provider` e SA `github-actions-deploy@zera-512810.iam.gserviceaccount.com`. A condicao atual aceita a org `zera-interdisciplinar`; a SA precisa manter permissoes de push e apply no namespace.
- Secret de gateway existente no namespace. Nao copiar a chave para arquivos versionados.
- Ingresses e certificados pertencem a `infra-gtw-kong`; nao ao workflow do painel. ArgoCD gerencia esses manifests.
- Registros DNS `qa` e `gestao` apontando para o LoadBalancer do Kong. IP observado em 01/11/2026: `34.39.143.218`; conferir novamente antes de qualquer troca futura.
- Cert-manager e `ClusterIssuer zera-letsencrypt`, provisionados pela infra. HTTP-01 precisa chegar ao Kong; nao bloquear `/.well-known/acme-challenge/` no Cloudflare. Depois de emitir o certificado de origem, usar SSL Full (strict), sem reduzir validacao de TLS.

## Permissao do repositorio no WIF

O provider aceita a organizacao, mas a conta de deploy possui uma lista de repositorios autorizados. Incluir `zera-interdisciplinar/zera-web-app` em `roles/iam.workloadIdentityUser` da SA `github-actions-deploy@zera-512810.iam.gserviceaccount.com`; a regra do provider sozinha nao libera a emissao do token. Usar o principalSet especifico do repositorio, sem ampliar a organizacao inteira e sem gerar chave persistente. Ausente essa permissao, `get-gke-credentials` falha com `iam.serviceAccounts.getAccessToken`.

## Pipeline

`deploy-web.yml` reaproveita o CI completo (estrutura, lint, tipos, cobertura, build, bundle e navegador). Depois autentica por OIDC, confere o Secret, constrói a imagem sem arquivos `.env`, publica com SHA e aplica um digest imutavel. Kustomize gera ConfigMap com hash: uma mudanca de configuracao provoca rollout. O processo roda sem root, sem token de ServiceAccount e com filesystem somente leitura.

```sh
kubectl kustomize k8s/overlays/qa
kubectl kustomize k8s/overlays/production
```

A substituicao de `IMAGE_TAG` ocorre no workflow; nunca aplicar o placeholder diretamente. O workflow faz dry-run no servidor, espera rollout e registra SHA/digest na anotacao do Deployment.

## Liberacao e retorno

1. Revisar e integrar a versao na branch `qa`; o push publica QA.
2. Conferir `/login`, carregamento direto de `/itens`, login de gestor, negacao para funcionario e stream do dashboard. Testes controlados nao substituem credenciais reais.
3. Promover a mesma versao validada para `main`.
4. Ativar e validar previamente as dependencias de producao. Em 01/11/2026, administrativo, inventario, BFF e diversas dependencias estavam intencionalmente com zero replicas; este trabalho nao as reativa.
5. Publicar uma GitHub Release cujo commit pertence a `main`. O pipeline recusa producao com APIs principais sem replicas disponiveis.
6. Conferir dominios/certificados e os fluxos reais de producao.

Rollback do app: `kubectl rollout undo deployment/zera-web-app -n <namespace>` e acompanhar rollout. O ConfigMap de hash anterior e mantido por Kustomize/apply; nao excluir ConfigMaps em uso. Para persistir o rollback, revert no Git da versao/configuracao correspondente e publicar pelo mesmo fluxo. Alteracoes do Kong devem ser revertidas no Git da infra, pois o ArgoCD corrige mudancas manuais.

Fontes: [Kong routing](https://developer.konghq.com/gateway/routing/traditional/), [Kong annotations](https://developer.konghq.com/kubernetes-ingress-controller/reference/annotations/), [cert-manager HTTP-01](https://cert-manager.io/docs/configuration/acme/http01/).
