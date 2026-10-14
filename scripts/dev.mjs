// Inicia o Vite e propaga o encerramento do servidor de desenvolvimento.
import { spawn } from 'node:child_process'
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' })
child.on('error', () => { console.error('Não foi possível iniciar o Zera.'); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
