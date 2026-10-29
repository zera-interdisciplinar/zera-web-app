import type { SetStateAction } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EstadoLocalLogin } from '../types/controles/EstadoLocalLogin'
import type { Credenciais } from '../types/usuario'
import { destinoAposLogin } from '../utils/destinoLogin'
import { validarCredenciais } from '../utils/validacao'
import { useAuth } from './useAuth'
import { usePublicacao } from './usePublicacao'

export function useLogin() {
  const { entrar, entrando, erro, autenticado } = useAuth()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const { paginaEstatica } = usePublicacao()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalLogin>(() => ({
    formulario: { email: '', senha: '' },
    erros: {},
    mostrarErro: false,
    bloqueio: { falhas: 0, bloqueadoAte: 0, restante: 0 },
  }))
  const { formulario, erros, mostrarErro, bloqueio } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setFormulario, setErros, setMostrarErro, setBloqueio } = useMemo(() => ({
    setFormulario: (valor: SetStateAction<EstadoLocalLogin['formulario']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.formulario) : valor
      return Object.is(atual.formulario, proximo) ? atual : { ...atual, formulario: proximo }
    }),
    setErros: (valor: SetStateAction<EstadoLocalLogin['erros']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erros) : valor
      return Object.is(atual.erros, proximo) ? atual : { ...atual, erros: proximo }
    }),
    setMostrarErro: (valor: SetStateAction<EstadoLocalLogin['mostrarErro']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.mostrarErro) : valor
      return Object.is(atual.mostrarErro, proximo) ? atual : { ...atual, mostrarErro: proximo }
    }),
    setBloqueio: (valor: SetStateAction<EstadoLocalLogin['bloqueio']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.bloqueio) : valor
      return Object.is(atual.bloqueio, proximo) ? atual : { ...atual, bloqueio: proximo }
    }),
  }), [])

  useEffect(() => {
    if (autenticado) navegar(destinoAposLogin(localizacao.state), { replace: true })
  }, [autenticado, navegar, localizacao.state])

  useEffect(() => {
    if (!bloqueio.bloqueadoAte) return
    const atualizarContador = () => {
      const restante = Math.max(0, Math.ceil((bloqueio.bloqueadoAte - Date.now()) / 1000))
      setBloqueio((atual) => {
        if (restante === 0) return { falhas: 0, bloqueadoAte: 0, restante: 0 }
        return atual.restante === restante ? atual : { ...atual, restante }
      })
    }
    atualizarContador()
    const temporizador = window.setInterval(atualizarContador, 200)
    return () => window.clearInterval(temporizador)
  }, [bloqueio.bloqueadoAte, setBloqueio])

  async function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (entrando || bloqueio.restante > 0) return

    setMostrarErro(false)
    const validacao = validarCredenciais(formulario)
    setErros(validacao.erros)
    if (!validacao.valido) {
      const primeiroCampo = Object.keys(validacao.erros)[0]
      if (primeiroCampo) document.getElementById(primeiroCampo)?.focus()
      return
    }

    const resultado = await entrar(validacao.dados)
    if (resultado === 'autenticado') {
      setBloqueio({ falhas: 0, bloqueadoAte: 0, restante: 0 })
      navegar(destinoAposLogin(localizacao.state), { replace: true })
      return
    }

    setMostrarErro(true)
    setErros({})
    setFormulario({ email: '', senha: '' })
    requestAnimationFrame(() => document.getElementById('email')?.focus())
    if (resultado === 'credenciais-invalidas') {
      setBloqueio((atual) => {
        const falhas = atual.falhas + 1
        return falhas >= 3
          ? { falhas: 0, bloqueadoAte: Date.now() + 3000, restante: 3 }
          : { ...atual, falhas }
      })
    } else {
      setBloqueio((atual) => ({ ...atual, falhas: 0 }))
    }
  }

  function alterarCampo(campo: keyof Credenciais, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setMostrarErro(false)
    setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }
  return { entrando, erro, paginaEstatica, formulario, erros, mostrarErro, bloqueio, aoEnviar, alterarCampo }
}
