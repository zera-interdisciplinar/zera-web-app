import { readdirSync, readFileSync } from 'node:fs'
import ts from 'typescript'

function listar(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => entrada.isDirectory() ? listar(`${pasta}/${entrada.name}`) : [`${pasta}/${entrada.name}`])
}
const problemas = []
for (const arquivo of listar('src')) {
  if (!/\.tsx?$/.test(arquivo)) { problemas.push(`${arquivo}: extensão fora do padrão`); continue }
  const texto = readFileSync(arquivo, 'utf8')
  const codigo = ts.createSourceFile(arquivo, texto, ts.ScriptTarget.Latest, true)
  const vista = /src\/(components|pages)\//.test(arquivo)
  if (vista && arquivo.endsWith('.tsx') && !arquivo.endsWith('/index.tsx')) problemas.push(`${arquivo}: componente sem pasta própria e index.tsx`)
  function visitar(no) {
    if (no.kind === ts.SyntaxKind.AnyKeyword) problemas.push(`${arquivo}: tipo any`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'fetch' && !arquivo.startsWith('src/services/')) problemas.push(`${arquivo}: fetch fora de services`)
    if (ts.isJsxAttribute(no) && no.name.getText(codigo) === 'dangerouslySetInnerHTML') problemas.push(`${arquivo}: HTML externo`)
    if (ts.isImportDeclaration(no) && vista && ts.isStringLiteral(no.moduleSpecifier) && no.moduleSpecifier.text.includes('/services/')) problemas.push(`${arquivo}: vista acessa serviço`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'useEffect' && (no.arguments.length !== 2 || !ts.isArrayLiteralExpression(no.arguments[1]))) problemas.push(`${arquivo}: efeito sem dependências explícitas`)
    if (ts.isFunctionDeclaration(no) && no.body) {
      const estados = no.body.statements.filter(ts.isVariableStatement).flatMap((declaracao) => declaracao.declarationList.declarations).filter((declaracao) => declaracao.initializer && ts.isCallExpression(declaracao.initializer) && declaracao.initializer.expression.getText(codigo) === 'useState')
      if (estados.length > 1) problemas.push(`${arquivo}: agrupe o estado relacionado`)
      if (vista && /^[A-Z]/.test(no.name?.text ?? '')) {
        for (const parametro of no.parameters) {
          const nome = parametro.type && ts.isTypeReferenceNode(parametro.type) ? parametro.type.typeName.getText(codigo) : null
          const tipoExterno = nome && codigo.statements.some((declaracao) => ts.isImportDeclaration(declaracao) && declaracao.moduleSpecifier.text.includes('/types/') && declaracao.importClause?.namedBindings && ts.isNamedImports(declaracao.importClause.namedBindings) && declaracao.importClause.namedBindings.elements.some((elemento) => elemento.name.text === nome))
          if (!tipoExterno) problemas.push(`${arquivo}: props precisam de interface em types`)
        }
      }
    }
    ts.forEachChild(no, visitar)
  }
  visitar(codigo)
}
for (const pasta of ['src/components', 'src/pages']) {
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    if (!entrada.isDirectory()) problemas.push(`${pasta}/${entrada.name}: use pasta própria`)
    else if (!readdirSync(`${pasta}/${entrada.name}`).includes('index.tsx')) problemas.push(`${pasta}/${entrada.name}: falta index.tsx`)
  }
}
const tokens = JSON.parse(readFileSync('tests/fixtures/design-tokens.json', 'utf8'))
const css = readFileSync('styles/tokens.css', 'utf8')
for (const [nome, token] of Object.entries(tokens.color)) {
  const hex = token.$value.hex
  if (!new RegExp(`--${nome}:\\s*${hex}`, 'i').test(css)) problemas.push(`Token de cor divergente: ${nome}`)
}
if (problemas.length) { process.stderr.write(problemas.join('\n') + '\n'); process.exitCode = 1 }
else process.stdout.write('Estrutura, limites de serviços e tokens verificados.\n')
