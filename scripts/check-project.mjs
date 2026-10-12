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
  if (/@ts-ignore\b/.test(texto)) problemas.push(`${arquivo}: supressão @ts-ignore`)
  if (vista && arquivo.endsWith('.tsx') && !arquivo.endsWith('/index.tsx')) problemas.push(`${arquivo}: componente sem pasta própria e index.tsx`)
  function visitar(no) {
    if (no.kind === ts.SyntaxKind.AnyKeyword) problemas.push(`${arquivo}: tipo any`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'fetch' && !arquivo.startsWith('src/services/')) problemas.push(`${arquivo}: fetch fora de services`)
    if (ts.isCallExpression(no) && ts.isPropertyAccessExpression(no.expression) && ['window', 'globalThis'].includes(no.expression.expression.getText(codigo)) && no.expression.name.text === 'fetch' && !arquivo.startsWith('src/services/')) problemas.push(`${arquivo}: fetch fora de services`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'alert') problemas.push(`${arquivo}: alert fora do DOM`)
    if (ts.isPropertyAccessExpression(no) && no.expression.getText(codigo) === 'window' && no.name.text === 'location') problemas.push(`${arquivo}: window.location`)
    if (ts.isPropertyAccessExpression(no) && no.name.text === 'localStorage' && arquivo !== 'src/utils/storage.ts') problemas.push(`${arquivo}: localStorage fora de storage.ts`)
    if (ts.isIdentifier(no) && no.text === 'localStorage' && (!ts.isPropertyAccessExpression(no.parent) || no.parent.name !== no) && arquivo !== 'src/utils/storage.ts') problemas.push(`${arquivo}: localStorage fora de storage.ts`)
    if (ts.isJsxAttribute(no) && no.name.getText(codigo) === 'dangerouslySetInnerHTML') problemas.push(`${arquivo}: HTML externo`)
    if (ts.isJsxAttribute(no) && no.name.getText(codigo) === 'key' && no.initializer && ts.isJsxExpression(no.initializer) && no.initializer.expression && ts.isIdentifier(no.initializer.expression) && ['index', 'i'].includes(no.initializer.expression.text)) problemas.push(`${arquivo}: key baseada em índice`)
    if ((ts.isJsxOpeningElement(no) || ts.isJsxSelfClosingElement(no)) && no.tagName.getText(codigo) === 'img' && !no.attributes.properties.some(p => ts.isJsxAttribute(p) && p.name.getText(codigo) === 'alt')) problemas.push(`${arquivo}: imagem sem alt`)
    if (ts.isImportDeclaration(no) && vista && ts.isStringLiteral(no.moduleSpecifier) && no.moduleSpecifier.text.includes('/services/')) problemas.push(`${arquivo}: vista acessa serviço`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && no.expression.text === 'useEffect' && (no.arguments.length !== 2 || !ts.isArrayLiteralExpression(no.arguments[1]))) problemas.push(`${arquivo}: efeito sem dependências explícitas`)
    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression) && ['useCallback', 'useMemo'].includes(no.expression.text)) {
      let declaracao = no
      while (declaracao.parent && !ts.isStatement(declaracao)) declaracao = declaracao.parent
      const inicio = codigo.getLineAndCharacterOfPosition(declaracao.getStart(codigo)).line
      const linhaAnterior = texto.split(/\r?\n/)[inicio - 1]?.trim() ?? ''
      if (!/^\/\/\s*\S/.test(linhaAnterior) && !/\*\/$/.test(linhaAnterior)) problemas.push(`${arquivo}:${inicio + 1}: ${no.expression.text} sem justificativa anterior`)
    }
    if (ts.isCallExpression(no) && ts.isPropertyAccessExpression(no.expression) && no.expression.name.text === 'map') {
      const callback = no.arguments[0]
      const indice = callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && callback.parameters[1]?.name
      if (indice && ts.isIdentifier(indice)) {
        function verificarKey(filho) {
          if (ts.isJsxAttribute(filho) && filho.name.getText(codigo) === 'key' && filho.initializer && ts.isJsxExpression(filho.initializer) && filho.initializer.expression && ts.isIdentifier(filho.initializer.expression) && filho.initializer.expression.text === indice.text) problemas.push(`${arquivo}: key usa índice de map`)
          ts.forEachChild(filho, verificarKey)
        }
        verificarKey(callback.body)
      }
    }
    if (ts.isVariableDeclaration(no) && no.initializer && ts.isCallExpression(no.initializer) && no.initializer.expression.getText(codigo) === 'useParams' && ts.isObjectBindingPattern(no.name)) {
      let funcao = no.parent
      while (funcao && !ts.isFunctionLike(funcao)) funcao = funcao.parent
      for (const campo of no.name.elements) {
        if (!ts.isIdentifier(campo.name) || !funcao?.body) { problemas.push(`${arquivo}: parâmetro de rota sem verificação identificável`); continue }
        let protegido = false
        function procurarGuarda(filho) {
          if (ts.isIfStatement(filho)) {
            const condicao = filho.expression.getText(codigo)
            const nome = campo.name.text
            if (new RegExp(`!\\s*${nome}\\b|\\b${nome}\\s*(?:===?|!==?)\\s*undefined\\b|\\bundefined\\s*(?:===?|!==?)\\s*${nome}\\b`).test(condicao)) protegido = true
          }
          ts.forEachChild(filho, procurarGuarda)
        }
        procurarGuarda(funcao.body)
        if (!protegido) problemas.push(`${arquivo}: parâmetro ${campo.name.text} sem guarda identificável`)
      }
    }
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
