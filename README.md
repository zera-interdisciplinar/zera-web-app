# Zera — gestão de resíduos eletrônicos

Aplicação Vite, React e TypeScript para acompanhar categorias, modelos e equipamentos identificados por etiqueta: inventário, triagem, manutenção, alertas, recicladoras e descartes. Funcionários operam o inventário e a triagem; gestores consultam estoque, categorias, análise preventiva e prévias de relatórios; administradores também acessam usuários, relatórios e configurações. As permissões do backend prevalecem sobre a interface.

MSW é uma demonstração local explicitamente ativada e identificada nas telas. O administrador demonstrativo depende de uma fixture local ignorada pelo Git e não distribuída. O build de produção não ativa MSW. Integrações reais usam APIs HTTPS autenticadas; PostgreSQL e Neo4j não são acessados pelo navegador. Evidências e limitações estão em `AUDITORIA.md`. A avaliação acadêmica `ENTREGAS.md` é mantida somente no checkout local.

O painel de acessibilidade permite ler o conteúdo em voz alta usando uma voz local em português, sem microfone nem leitura dos campos de formulário. A leitura para ao fechar o painel ou sair da página. A navegação por leitor de tela do sistema permanece disponível pelos landmarks, headings, labels e mensagens anunciadas.

No PowerShell, a partir da pasta `ZERA - Entrega Final` do workspace. Antes de reinstalar, encerre os terminais de dev/preview deste projeto com `Ctrl+C`, para liberar os binários no Windows:

```powershell
cd .\Zera-Web
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
if ($LASTEXITCODE -ne 0) { throw 'A instalação falhou. Corrija antes de iniciar o frontend.' }
npm run dev
```

O servidor abre em `http://localhost:5173`. Configure apenas URLs públicas HTTPS nas variáveis de API para usar os serviços reais. Nunca coloque credenciais de banco ou tokens em `VITE_*`.

Quando precisar do backend legado do workspace, com Docker Desktop disponível:

```powershell
docker compose -f '..\07 - Operacoes Ageis (DevOps)\Infraestrutura (Docker)\docker-compose.yml' up -d postgres redis backend-api
```

O Compose fica fora de um clone standalone. Esses três serviços foram iniciados e verificados; esse backend usa contratos diferentes do QA. O frontend demonstrativo funciona sem Docker. Não execute a inicialização geral do grafo: o artefato do workspace contém exclusão de dados Neo4j.

Para validar, use outro terminal na pasta do projeto. Esses comandos terminam após a verificação:

```powershell
npm run lint
npm run build
npm test
```

Para visualizar o build, execute separadamente:

```powershell
npm run preview
```

`dev` e `preview` mantêm o terminal ocupado até `Ctrl+C`. Não execute `npm ci` enquanto um deles estiver rodando neste checkout.
