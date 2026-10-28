import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { loadEnv } from 'vite'

const root = process.cwd()
const viteUseMsw = process.env.VITE_USE_MSW ?? loadEnv('development', root, 'VITE_').VITE_USE_MSW

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'ignore',
      windowsHide: true,
      ...options,
    })

    child.once('error', (error) => resolveRun({ ok: false, error }))
    child.once('close', (code) => resolveRun({ ok: code === 0, code }))
  })
}

function desktopCandidates() {
  if (process.platform !== 'win32') return []

  return [
    process.env.ProgramFiles && join(process.env.ProgramFiles, 'Docker', 'Docker', 'Docker Desktop.exe'),
    process.env.ProgramW6432 && join(process.env.ProgramW6432, 'Docker', 'Docker', 'Docker Desktop.exe'),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'DockerDesktop', 'Docker Desktop.exe'),
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
  ].filter(Boolean)
}

async function launchDockerDesktop() {
  const launchDetached = (command, args) => new Promise((resolveLaunch) => {
    const child = spawn(command, args, {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    child.once('error', (error) => resolveLaunch({ ok: false, error }))
    child.once('spawn', () => {
      child.unref()
      resolveLaunch({ ok: true })
    })
  })

  if (process.platform === 'darwin') {
    return launchDetached('open', ['-a', 'Docker'])
  }

  const executable = desktopCandidates().find(existsSync)
  if (!executable) return { ok: false, error: new Error('Docker Desktop não encontrado') }

  return launchDetached(executable, [])
}

async function dockerInfo() {
  return run('docker', ['info'])
}

async function ensureDocker() {
  console.log('[dev] Verificando Docker (docker info)...')
  const initial = await dockerInfo()
  if (initial.ok) {
    console.log('[dev] Docker daemon: disponível.')
    return true
  }

  console.log('[dev] Docker daemon: indisponível; tentando iniciar Docker Desktop.')
  const started = await launchDockerDesktop()
  if (!started.ok) {
    const reason = started.error?.code === 'ENOENT' ? 'Docker Desktop não foi encontrado.' : 'Não foi possível iniciar o Docker Desktop.'
    console.log(`[dev] ${reason}`)
    return false
  }

  console.log('[dev] Docker Desktop iniciado; aguardando o daemon (limite: 180 segundos).')
  const timeoutMs = 180_000
  const intervalMs = 5_000
  const startedAt = Date.now()
  let lastProgress = 0

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolveWait) => setTimeout(resolveWait, intervalMs))
    const elapsedSeconds = Math.min(Math.floor((Date.now() - startedAt) / 1_000), 180)
    const result = await dockerInfo()
    if (result.ok) {
      console.log(`[dev] Docker daemon: disponível após ${elapsedSeconds} segundos.`)
      return true
    }

    if (elapsedSeconds >= lastProgress + 10) {
      lastProgress = elapsedSeconds
      console.log(`[dev] Aguardando Docker Desktop: ${elapsedSeconds}/180 segundos.`)
    }
  }

  console.log('[dev] Docker daemon: não iniciou dentro de 180 segundos.')
  return false
}

async function startCompose() {
  console.log('[dev] Iniciando containers (docker compose up -d --build --wait)...')
  const result = await run('docker', ['compose', 'up', '-d', '--build', '--wait'], { stdio: 'inherit' })
  if (!result.ok) {
    console.error(`[dev] docker compose up -d --wait falhou${result.code === undefined ? '' : ` (código ${result.code})`}.`)
    return false
  }
  console.log('[dev] Containers: ativos.')
  return true
}

function startVite() {
  console.log('[dev] Iniciando Vite em http://localhost:80. Ctrl+C encerra o Vite.')
  const viteCli = resolve(root, 'node_modules/vite/bin/vite.js')
  const child = spawn(process.execPath, [viteCli], {
    cwd: root,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: true,
  })
  let linhaPendente = ''
  let urlExibida = false

  const encaminharSaida = (stream, dados) => {
    const texto = dados.toString()
    stream.write(texto)
    linhaPendente += texto

    const linhas = linhaPendente.split(/\r?\n/)
    linhaPendente = linhas.pop() ?? ''
    for (const linha of linhas) exibirUrlLocal(linha)
  }

  const exibirUrlLocal = (linha) => {
    if (urlExibida) return
    const limpa = linha.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
    const correspondencia = limpa.match(/\bLocal:\s*(https?:\/\/[^\s]+)/)
    if (!correspondencia) return
    urlExibida = true
    console.log(`\n[dev] App em: ${correspondencia[1]}\n`)
  }

  child.stdout?.on('data', (dados) => encaminharSaida(process.stdout, dados))
  child.stderr?.on('data', (dados) => encaminharSaida(process.stderr, dados))

  const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal)
  }

  process.once('SIGINT', forwardSignal)
  process.once('SIGTERM', forwardSignal)

  child.once('error', (error) => {
    console.error(`[dev] Não foi possível iniciar o Vite (${error.code ?? 'erro de processo'}).`)
    process.exitCode = 1
  })
  child.once('close', (code, signal) => {
    exibirUrlLocal(linhaPendente)
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1)
  })
}

const usarDocker = process.env.ZERA_START_DOCKER === 'true'
const dockerReady = usarDocker ? await ensureDocker() : false
if (dockerReady) {
  const containersReady = await startCompose()
  if (!containersReady) process.exit(1)
} else if (!usarDocker) {
  console.log('[dev] Usando proxies do Vite; Docker local nao e necessario para APIs remotas.')
} else if (viteUseMsw === 'true') {
  console.warn('[dev] AVISO: Docker não está disponível. VITE_USE_MSW=true; continuando apenas com Vite/MSW.')
} else {
  console.error('[dev] ERRO: Docker não está disponível e VITE_USE_MSW não está habilitado. Vite não foi iniciado.')
  process.exit(1)
}

startVite()
