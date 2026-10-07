# Design system do Zera

O Zera acompanha o ciclo dos itens de uma organização: cadastro, avaliação, manutenção, reaproveitamento e descarte. A aplicação web reúne o inventário e as informações necessárias para decidir o próximo destino de cada item. A interface deve facilitar a consulta, explicar o estado atual e tornar as ações previsíveis.

## Identidade visual

As três referências de dashboard, inventário e cadastro definem a composição: cabeçalho branco, navegação azul à esquerda, fundo creme, cartões brancos e ações em âmbar. O cadastro usa painel azul com campos brancos. A marca deve usar os arquivos vetoriais do projeto, sem redesenhar o logotipo como texto.

A paleta abaixo foi medida nos pixels de áreas sólidas das referências. Antialiasing, compressão e escala podem alterar pixels nas bordas. A família tipográfica original, medidas em rem, grade interna e animações não podem ser recuperadas com certeza a partir de uma imagem. As regras de implementação a seguir são escolhas explícitas para manter a identidade e a legibilidade.

| Token CSS | Cor | Uso |
| --- | --- | --- |
| `--navy` | `#162F71` | Navegação, marca, títulos de destaque e painel de cadastro |
| `--navy-suave` | `#24438C` | Cartão da conta e interação sobre azul |
| `--azul` | `#2A58CE` | Links e informação |
| `--azul-claro` | `#D8E2FF` | Trilho do gráfico circular |
| `--ambar` | `#EC9E1D` | Ação principal e destaques |
| `--verde` | `#25B988` | Cor de marca associada ao reaproveitamento |
| `--creme`, `--fundo` | `#F2EAD9` | Fundo das páginas |
| `--branco` | `#FFFFFF` | Superfícies e texto sobre azul |
| `--texto` | `#171B2E` | Texto principal |
| `--texto-secundario` | `#58647B` | Descrições, rótulos e metadados |
| `--borda-controle` | `#75819A` | Limite visível de campos e botões secundários |
| `--ambar-texto` | `#8A5E0E` | Pendência em superfície clara |
| `--verde-texto` | `#307050` | Sucesso em texto e arco do gráfico |
| `--perigo` | `#C0453E` | Erro e ação destrutiva |

O âmbar recebe texto azul, porque texto branco pequeno não alcança o contraste exigido. O verde de marca recebe uma variante escura nos ícones brancos, textos e gráficos que transmitem informação. Os estados também têm palavras e mensagens: a cor nunca deve ser a única informação.

## Tipografia e medidas

Public Sans é a família de títulos e interface. JetBrains Mono fica restrita a identificadores técnicos. As fontes são distribuídas com a aplicação. O tamanho padrão é `1rem`, com altura de linha `1.5`. Não fixe a escala do navegador nem impeça o zoom.

| Elemento | Tamanho | Peso e altura de linha |
| --- | --- | --- |
| Título de página | `clamp(1.5rem, 1.2rem + 0.6vw, 2rem)` | 700 / 1.25 |
| Título de cartão | `1.25rem` | 700 / 1.4 |
| Valor de indicador | `2.25rem` | 700 / aproximadamente 1.22 |
| Texto e campo | `1rem` | 400 / 1.5 |
| Texto de tabela | `0.9375rem` | 400 / 1.5 |
| Informação auxiliar | `0.8125rem` a `0.875rem` | 400 ou 700 / 1.5 |
| Rótulo de campo | `0.75rem` | 700 / 1.5 |

A escala de espaços é 4, 8, 12, 16, 20, 24, 32, 40, 48 e 64 px. Use os tokens `--sp-*`, sem ajustar cada tela de forma independente. Os cartões têm raio de 16 px; campos, 12 px; botões e navegação, 10 px; modais, 20 px. Formas circulares ficam reservadas a avatares e indicadores.

## Estrutura e adaptação

No desktop, o cabeçalho tem 64 px e a navegação 232 px. O conteúdo usa colunas `minmax(0, 1fr)`, margem interna de 24 a 32 px e intervalos de 16 a 24 px. O dashboard apresenta quatro indicadores e uma divisão de dois para um entre gráficos. Abaixo de 1080 px, os indicadores passam para duas colunas e os gráficos para uma.

Abaixo de 960 px, a navegação ocupa 220 px. Até 640 px, cabeçalho e navegação entram no fluxo da página, os cartões usam uma coluna e as ações do modal ficam empilhadas. As tabelas permitem rolagem horizontal em região focável, sem provocar rolagem lateral da página. O conteúdo deve continuar disponível a 320 px e com ampliação do texto.

## Componentes e comportamento

- **Navegação:** item ativo branco sobre azul, rótulo visível e ícone auxiliar. Links levam a páginas; botões executam ações.
- **Busca:** campo branco com borda, rótulo acessível e placeholder auxiliar. A busca mantém o termo durante a consulta e informa quando não há resultados.
- **Indicadores:** título, valor e informação de período. Números devem vir do mesmo conjunto de dados e filtros apresentado na página.
- **Tabela:** cabeçalhos claros, situação escrita por extenso e ações com nomes acessíveis. Editar e excluir ficam separados; a exclusão exige confirmação com o nome do item.
- **Cadastro:** campos brancos sobre painel azul, rótulos associados, limites de tamanho e erros específicos próximos ao campo. Não limpar o preenchimento após erro de serviço.
- **Modal:** foco inicial no primeiro campo, Tab contido no diálogo, Escape para fechar e retorno do foco à origem. Quando há alterações, a confirmação de descarte protege o preenchimento.
- **Feedback:** carregamento, sucesso e erro aparecem no DOM. Uma mensagem de erro explica o problema e a próxima ação; o sucesso informa o resultado.

Todos os controles de ação têm área de pelo menos 44 × 44 px. O foco usa contorno de 3 px com afastamento de 2 px e anel branco auxiliar. Sobre o painel azul, o contorno é âmbar. As transições duram 160 ms; a preferência `prefers-reduced-motion` reduz animações e remove rolagem animada.

## Escrita e acessibilidade

Use frases curtas, verbos concretos e termos consistentes: “Adicionar item”, “Salvar alterações”, “Cancelar”, “Excluir item”. Explique erros por campo, como “Informe o nome do item” ou “Use um e-mail válido”. Evite mensagens sobre implementação, desenvolvimento ou ferramentas usadas para construir o produto.

Texto normal precisa de contraste mínimo de 4,5:1; texto grande e limites essenciais de controles, 3:1. Labels, nomes acessíveis, landmarks, estado expandido, associação entre abas e painéis, ordem de foco e mensagens de erro fazem parte do componente, não de uma adaptação posterior. Opções de contraste e espaçamento devem preservar conteúdo e navegação.

Os testes de contraste verificam os pares de tokens usados. Eles não comprovam conformidade completa com WCAG. A entrega também precisa de navegação real com teclado, inspeção dos diálogos, zoom, telas pequenas e leitor de tela. Filtros de daltonismo são aproximações visuais; não substituem avaliação com pessoas. Não atribua resultados de testes humanos, mapas de calor ou métricas de atenção a verificações automatizadas.

## Manutenção

Os tokens intercambiáveis estão em `docs/design-tokens.json`, no formato DTCG. O CSS mantém os mesmos valores. Alterações globais devem atualizar ambos e passar pelos testes de contraste. Novos componentes usam os tokens existentes; uma nova cor ou medida precisa de uma finalidade que não esteja atendida.

Prefira manter a mesma estrutura entre páginas. Não substitua tabelas por listas que escondem informação, não use só ícones para tarefas pouco familiares e não mova controles conforme supostas preferências sem escolha explícita da pessoa. O projeto não inclui um modo escuro: novas superfícies precisam de paleta própria e validação antes de serem oferecidas.

As referências técnicas são a [WCAG 2.1](https://www.w3.org/TR/WCAG21/), o [padrão de diálogo modal do WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) e o [formato de tokens DTCG](https://www.designtokens.org/tr/2025.10/format/).
