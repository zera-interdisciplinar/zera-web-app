import { readdirSync, readFileSync } from 'node:fs'
import { loadEnv } from 'vite'

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`])
}
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env }
const secrets = Object.entries(env).filter(([key, value]) => /PASSWORD|SECRET|API_KEY|QA_.*EMAIL|DEMO_.*EMAIL/.test(key) && typeof value === 'string' && value.length >= 8).map(([, value]) => value)
const issues = []
for (const file of files('dist')) {
  if (/(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|p12|pfx)$/.test(file)) issues.push(file)
  if (!/\.(?:js|html|css|json|txt|map)$/.test(file)) continue
  const content = readFileSync(file, 'utf8')
  if (secrets.some((secret) => content.includes(secret)) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}/.test(content)) issues.push(file)
}
if (issues.length) { console.error('Publicação bloqueada: configuração privada encontrada em', [...new Set(issues)].join(', ')); process.exitCode = 1 }
else console.log('Publicação verificada: nenhum arquivo de ambiente ou valor privado no bundle.')
