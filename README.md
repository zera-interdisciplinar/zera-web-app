# Zera — gestão de resíduos eletrônicos

Aplicação Vite, React e TypeScript para acompanhar categorias, modelos e equipamentos identificados por etiqueta: inventário, triagem, manutenção, alertas, recicladoras e descartes. Funcionários operam o inventário e a triagem; gestores consultam estoque, categorias e análise preventiva; administradores também acessam usuários, relatórios e configurações. As permissões do backend prevalecem sobre a interface.

MSW é uma demonstração local explicitamente ativada e identificada nas telas. O administrador demonstrativo depende de uma fixture local ignorada pelo Git e não distribuída. O build de produção não ativa MSW. Integrações reais usam APIs HTTPS autenticadas; PostgreSQL e Neo4j não são acessados pelo navegador. Evidências e limitações estão em `ENTREGAS.md` e `AUDITORIA.md`.

No PowerShell, a partir da pasta `ZERA - Entrega Final` do workspace:

```powershell
cd .\Zera-Web
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev
```

O servidor abre em `http://localhost:5173`. Configure apenas URLs públicas HTTPS nas variáveis de API para usar os serviços reais. Nunca coloque credenciais de banco ou tokens em `VITE_*`.

Quando precisar do backend legado do workspace, com Docker Desktop disponível:

```powershell
docker compose -f '..\07 - Operacoes Ageis (DevOps)\Infraestrutura (Docker)\docker-compose.yml' up -d postgres redis backend-api
```

O Compose fica fora de um clone standalone. Esses três serviços foram iniciados e verificados; esse backend usa contratos diferentes do QA. O frontend demonstrativo funciona sem Docker. Não execute a inicialização geral do grafo: o artefato do workspace contém exclusão de dados Neo4j.

Comandos de validação executados neste caminho Windows:

```powershell
npm run lint
npm run build
npm test
npm run preview
```
