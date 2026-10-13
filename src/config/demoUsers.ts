import type { Perfil } from '../types/usuario'

interface ConfiguracaoUsuarioDemo {
  chave: string
  chavePapel: string
  email: string
  senha: string
  papel: string
  nome: string
}

export interface UsuarioDemo {
  id: string
  email: string
  nome: string
  perfil: Exclude<Perfil, 'administrador'>
}

export type ResultadoAutenticacaoDemo =
  | { tipo: 'autenticado'; usuario: UsuarioDemo }
  | { tipo: 'credenciais-invalidas' }
  | { tipo: 'perfil-invalido' }

function configuracoes(): ConfiguracaoUsuarioDemo[] {
  const env = import.meta.env as unknown as Record<string, string | undefined>
  return [1, 2, 3].map((numero) => {
    const chave = `VITE_DEMO_USER_${numero}`
    const chaveEmail = `${chave}_EMAIL`
    const chaveSenha = `${chave}_PASSWORD`
    const chavePapel = `${chave}_ROLE`
    const chaveNome = `${chave}_NAME`

    return {
      chave,
      chavePapel,
      email: env[chaveEmail] ?? '',
      senha: env[chaveSenha] ?? '',
      papel: env[chavePapel] ?? '',
      nome: env[chaveNome] ?? '',
    }
  })
}

function mapearPapel(papel: string): UsuarioDemo['perfil'] | null {
  if (papel === 'EMPLOYEE') return 'funcionario'
  if (papel === 'MANAGER') return 'gestor'
  if (papel === 'ADMIN') {
    // TODO(contrato): ADMIN mapeado para MANAGER até confirmação
    return 'gestor'
  }
  return null
}

export function autenticarUsuarioDemo(email: string, senha: string): ResultadoAutenticacaoDemo {
  const emailNormalizado = email.trim().toLowerCase()
  if (!emailNormalizado.endsWith('@zera.com')) return { tipo: 'credenciais-invalidas' }

  for (const config of configuracoes()) {
    const emailConfigurado = config.email.trim().toLowerCase()
    if (!emailConfigurado || !emailConfigurado.endsWith('@zera.com')) continue
    if (!config.senha.trim() || config.senha.trim() === 'PREENCHER_NO_VSCODE' || !config.nome.trim()) continue
    if (emailNormalizado !== emailConfigurado) continue
    if (senha !== config.senha) return { tipo: 'credenciais-invalidas' }

    const perfil = mapearPapel(config.papel)
    if (!perfil) {
      console.warn(config.chavePapel)
      return { tipo: 'perfil-invalido' }
    }

    return {
      tipo: 'autenticado',
      usuario: {
        id: config.chave,
        email: config.email.trim(),
        nome: config.nome.trim(),
        perfil,
      },
    }
  }

  return { tipo: 'credenciais-invalidas' }
}
