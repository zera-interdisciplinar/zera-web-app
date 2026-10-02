# Verificação técnica — 02/10/2026

## Workspace, fontes e preservação

Pasta confirmada: `C:\Users\enzolanzani-ieg\OneDrive - Instituto J&F\Área de Trabalho\Projetos e Estudos\Tech\ZERA - Entrega Final\Zera-Web`. Nenhum AGENTS.md local adicional encontrado. Os dois anexos pasted-text.txt estavam acessíveis: emissor original (9.266 linhas, incluindo assets codificados) e escopo v2 (308 linhas). Foram processados integralmente como arquivos; a inspeção textual exibida do emissor foi parcial, com saídas truncadas. Não se declara leitura visual integral das 9.266 linhas. Assets locais da marca foram inspecionados; novas referências visuais separadas não estavam acessíveis.

Checkout recebido sem Git válido; a pasta .git vazia do pai foi preservada. Snapshot anterior às alterações mantido no diretório temporário local, sem .env. Nenhum arquivo foi removido por limpeza: redundância não demonstrada.

Artefatos encontrados no workspace pai e consultados sem modificação:

- `01 - Modelagem de Dados/sql/01_schema.sql`;
- `02 - Banco de Dados 2/neo4j/grafo.cypher`;
- `07 - Operacoes Ageis (DevOps)/Infraestrutura (Docker)/docker-compose.yml`;
- `05 - Dev 2 (API Java)/API Principal`.

SQL/Cypher não equivalem ao contrato QA (identificadores/enums/modelos diferentes). O Cypher contém `MATCH (n) DETACH DELETE n`: não foi executado. O serviço web do Compose aponta para outro frontend, `06 - Aplicacoes Dinamicas (Web)`. Nenhum backend foi copiado para o repositório.

## Contratos e transporte

Swagger carregou `swagger-initializer.js` → `/qa/{administrative|inventory}/swagger-ui/api-docs/swagger-config` → `/qa/{administrative|inventory}/swagger-ui/api-docs`. Ambos os documentos retornaram 200 e OpenAPI 3.1.0. Servers declara `http://34.95.129.59/qa/administrative/swagger-ui` e o equivalente `inventory/swagger-ui`; bases extraídas dos documentos, não inferidas da interface.

HTTPS desses documentos no mesmo IP falhou no transporte (TRANSPORT_ERROR). GET anônimo `/api/v1/users` e `/api/v1/items`, nas bases declaradas, retornou 401. Nenhuma credencial foi enviada por HTTP. OpenAPI não documenta consistentemente security/schemas de erros; 401 não comprova autorização por operação. O cliente exige HTTPS, recusa redirects e mantém token apenas em memória. Nenhuma sessão real foi criada.

Legenda: A = token administrativo em memória; I = token + X-Unit-Id. Todos os adaptadores reais aguardam smoke autenticado. PageResponse usa content/totalPages/page/size; paginação validada pelo cliente. Listas administrativas são arrays no documento; completude no servidor não comprovada.

| Tela/operação | Método/endpoint confirmado | Schema | Auth | Estado/limite |
|---|---|---|---|---|
| Login | POST /api/v1/auth/login | LoginRequest → TokenResponse | Anônimo | Implementado; envio QA bloqueado por HTTP. |
| Identidade | GET /api/v1/users/{id} | UserOutput | A | MANAGER/EMPLOYEE; desconhecidos rejeitados; ADMIN ausente. |
| Funcionários | GET /api/v1/users | UserOutput[] | A | Lista adaptada; rota atual admin. POST /users ausente; backend usa convites. |
| Recicladoras | GET/POST /api/v1/recyclings | RecyclingBusiness[] / RegisterRecyclingRequest → RecyclingBusiness | A | Lista/cadastro name/cnpj/email; cidade não inventada. |
| Categorias | GET/POST /api/v1/categories | CategoryResponse[] / CreateCategoryRequest → CategoryResponse | I | Nome/descrição; campos legados não enviados; UI gestor/admin. |
| Modelos | GET /api/v1/models | PageResponseModelResponse | I | Lista/materiais/vida útil; categoria filtrada localmente, sem query inexistente. |
| Criar modelo | POST /api/v1/models | CreateModelRequest + Actor na query | I | Apenas demo; serialização/autorização Actor não validadas. |
| Inventário | GET /api/v1/items | PageResponseItemResponse | I | UUID/oito estados/paginação/filtros; sem fixtures no modo real. |
| Detalhe | GET /api/v1/items/{id} | ItemResponse | I | Identificadores preservados e estados assíncronos. |
| Etiqueta | GET /api/v1/items/by-barcode/{barcode} | ItemResponse | I | Entrada manual/leitor como teclado, caminho codificado; câmera não implementada. |
| Editar item | PATCH /api/v1/items/{id} | UpdateItemRequest → ItemResponse | I | Nome/condição/notas; vazio preserva notas; somente teste controlado. |
| Criar/excluir item | POST /api/v1/items; DELETE /api/v1/items/{id} | CreateItemRequest / Actor obrigatório | I | Bloqueados até confirmar Actor; nenhum DELETE disparado. |
| Eventos | GET /api/v1/items/{id}/events | PageResponseEventResponse | I | Nova aba com loading/erro/lista. |
| Dashboard | GET /api/v1/dashboard/home; GET /api/v1/dashboard/indicators | HomeSummaryResponse / DisposalIndicatorsResponse | I | Indicadores e kg descartados; não apresentados como recuperação comprovada. |
| Descartes | GET /api/v1/disposals | PageResponseDisposalResponse | I | Tabela gestor/admin; demo explicita ausência de dados reais. |
| Confirmar descarte | POST /api/v1/disposals | CreateDisposalRequest + Actor | I | Sem escrita real, autorização/Actor não validados. |
| Configurações | GET /api/v1/unit-settings | UnitSettingsResponse | I | Capacidade de estoque; rota admin atual. |
| Alterar capacidade | PUT /api/v1/unit-settings | UpdateUnitSettingsRequest + Actor | I | Bloqueado; configurações legadas sem equivalência. |
| Triagem/manutenção | Transições /api/v1/items/{id}/... | Schemas próprios + Actor | I | Não equivalem a /triage/formulário legado; somente demo. |
| Preventiva/alertas | Sem contrato equivalente confirmado | — | — | Regras legadas somente demo, sem sucesso fictício em produção. |
| Prévia/envio de relatório | Sem contrato equivalente confirmado | — | — | Descartes não são relatórios enviados; somente demo. |
| Leitura Neo4j | Nenhum endpoint encontrado | — | — | Nenhum driver/conexão direta no frontend. |

Política alinhada ao escopo v2: Funcionários/Configurações exclusivos do administrador; gestor/admin consultam relatórios e geram prévias, somente admin confirma envio; triagem funcionário/admin; descartes gestor/admin. Teste de gestor confirmou menu, rota e ausência de controles de envio. Não existe ADMIN documentado no QA. Frontend não substitui autorização do backend.

## Docker/backend local

Docker CLI/server 24.0.6 disponível. Compose config --services passou. Executado somente `up -d postgres redis backend-api`: PostgreSQL/Redis healthy, backend running. Outros processos/serviços/volumes preservados; neo4j-init não iniciado.

GET `http://localhost:8080/v3/api-docs` retornou 200/OpenAPI 3.1.0. GET anônimo /api/produtos retornou 401. Login local /api/auth/login retorna LoginResponse diferente do QA e usa /api/..., não /api/v1/.... Não substitui os microsserviços. Persistência PostgreSQL autenticada e dados Neo4j não foram comprovados na UI.

## Segurança/ambiente

.env inspecionado somente por nomes/presença: VITE_API_BASE_URL e VITE_USE_MSW ativos. Não editado/publicado. .env.example também declara VITE_ADMIN_API_URL, VITE_INVENTORY_API_URL, VITE_ADMIN_OPENAPI_URL e VITE_INVENTORY_OPENAPI_URL. Nenhum nome novo adicionado; QA HTTP não ativado como API real.

Senha demonstrativa movida para fixtures.local/admin.json ignorado. Vite gera digest exclusivamente para validação local de desenvolvimento; produção elimina imports demo. MSW usa logs silenciosos. Tokens reais ficam em memória, expiram e são limpos ao sair, sem localStorage. Redirects de fetch recusados para impedir downgrade de HTTPS.

Busca em 237 arquivos de código/testes/assets/dist sem credencial demonstrativa/digest/padrões de chave privada/token GitHub/conexão de banco com senha. Revisão dos 152 arquivos staged antes do primeiro commit: .env, fixture local, node_modules, dist e backend ausentes. Busca estática não comprova ausência de todo segredo possível.

## Browser/acessibilidade

Chromium via agent-browser 0.27.0/CDP. Relatórios em docs/evidencias, sem campos de login. Rodada principal: 0 violações axe, 1 análise inconclusiva de contraste SVG/dashboard; zero falhas de teclado/RBAC/reflow e zero erros de runtime. 13 rotas/estados abertos diretamente; 26 combinações em 320 CSS px com texto 100%/200%. Login de produção a 320 CSS px/200% mediu clientWidth/scrollWidth iguais (305 px).

Teclado real: primeiro foco no skip link, Enter para main, Tab/Shift/Shift+Tab sem modal espontâneo, painel/foco/Escape/retorno, login, digitação e ciclo do modal. Categoria vazia/sucesso e código encontrado/inexistente passaram em MSW. Produção protege acesso direto/refresh, não ativa MSW e carrega página em chunk separado. Relatórios complementares contêm análises de contraste inconclusivas em estados adicionais; não tratadas como passes. Filtros por Enter/setas, rolagem horizontal de tabela por seta e abas por seta passaram. A falha de região rolável da prévia foi corrigida com foco e retestada sem violações axe.

Estilos computados dos textos do gráfico sobre card branco: rótulos/eixo/meta 5:1 e valor central 13,1:1. 14 testes de contraste incluem texto normal 4,5:1 e foco/arco 3:1. Todas as paletas, overlays e componentes/estados não possuem revisão manual completa. Tabelas têm região rolável/caption; barras têm tabela textual visível via details; donut tem alternativa em texto/aria-label.

Painel oferece tamanho, contraste, espaçamento, fonte do sistema, modo foco, guia não interativo, simulações aproximadas e ajuda por botão. Voz inicia somente por ativação explícita; parar/estado/aviso de processamento externo, encerramento ao fechar painel. Ciclo de ativação explícita/pt-BR/parada ao fechar testado com API de voz simulada, sem microfone. Microfone real não exercitado. OpenDyslexic não incluída sem asset/licença. Áudio/vídeo: não aplicável, nenhum existente encontrado.

Limites: NVDA/VoiceOver indisponíveis; zoom nativo, leitor de tela, toque/dispositivo físico, todos os modais/paletas/estados reais não executados. 320 CSS px + texto 200% não é chamado de zoom nativo. Não se afirma conformidade WCAG integral.

## Comandos/resultados

- npm ci: 249 pacotes instalados pelo lockfile; 0 vulnerabilidades reportadas; aviso de suporte da versão fixada de ESLint.
- npm run lint: passou.
- npm run build: TypeScript/Vite passaram; chunks por página.
- npm test: 55 testes, 5 arquivos; serviços/erros/paginação/HTTPS/OpenAPI/mapeamentos/14 contrastes.
- npm run dev: localhost:5173 verificado. Flags extras via npm shim não documentadas, pois uma tentativa falhou no caminho Windows.
- npm run preview: localhost:4173 observado.
- npm run msw:init: CLI local passou, worker necessário preservado.
- git diff --check e --cached --check: passaram após normalização de whitespace/CRLF apontados.

## GitHub/implantação

Git Credential Manager confirmou EnzoCasares, membro ativo e criação pública autorizada. Repo inicialmente 404; criado público em https://github.com/zera-interdisciplinar/zera-web-app. Main inicializada pelo GitHub; workspace baseado na main remota por reset mixed, preservando arquivos. Branch feat/complete-zera-web.

Commit implementação: 5870645, feat: implement Zera frontend and confirmed API contract adapters. Documentação/evidências em commit próprio. Publicação de código não é implantação. Vercel respondeu USER_NOT_LOGGED_IN; GitHub CLI ausente, usados Git/REST. M13/M14 não atendidos. Sem force push, histórico reescrito ou datas retroativas.
