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
  function visitar(no) {
    if (no.kind === ts.SyntaxKind.AnyKeyword) problemas.push(`${arquivo}: tipo any`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'fetch' && !arquivo.startsWith('src/services/')) problemas.push(`${arquivo}: fetch fora de services`)
    if (ts.isJsxAttribute(no) && no.name.getText(codigo) === 'dangerouslySetInnerHTML') problemas.push(`${arquivo}: HTML externo`)
    if (ts.isImportDeclaration(no) && arquivo.startsWith('src/components/') && ts.isStringLiteral(no.moduleSpecifier) && no.moduleSpecifier.text.includes('/services/')) problemas.push(`${arquivo}: componente acessa serviço`)
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
const tokens = JSON.parse(readFileSync('docs/design-tokens.json', 'utf8'))
const css = readFileSync('styles/tokens.css', 'utf8')
for (const [nome, token] of Object.entries(tokens.color)) {
  const hex = token.$value.hex
  if (!new RegExp(`--${nome}:\\s*${hex}`, 'i').test(css)) problemas.push(`Token de cor divergente: ${nome}`)
}
if (problemas.length) { process.stderr.write(problemas.join('\n') + '\n'); process.exitCode = 1 }
else process.stdout.write('Estrutura, limites de serviços e tokens verificados.\n')
