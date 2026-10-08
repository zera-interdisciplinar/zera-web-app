import { createContext, useEffect, useMemo, useState } from 'react'
import type { PreferenciasAcessibilidade } from '../types/acessibilidade'
import type { AcessibilidadeContextProps, ValorAcessibilidade } from '../types/componentes/AcessibilidadeContext'
import { carregar, salvar } from '../utils/storage'

const CHAVE_ACESSIBILIDADE = 'zera.acessibilidade.preferencias'

const preferenciasPadrao: PreferenciasAcessibilidade = {
  tamanhoTexto: 100,
  contrasteAlto: false,
  espacamento: false,
  modoFoco: false,
  fonteLegivel: false,
  guiaLeitura: false,
  simulacaoCores: 'nenhuma',
}

export const AcessibilidadeContext = createContext<ValorAcessibilidade | null>(null)

function preferenciaValida(valor: unknown): valor is PreferenciasAcessibilidade {
  if (typeof valor !== 'object' || valor === null) return false
  const dados = valor as Record<string, unknown>
  return (
    typeof dados.tamanhoTexto === 'number' &&
    [100, 115, 130, 150, 200].includes(dados.tamanhoTexto) &&
    typeof dados.contrasteAlto === 'boolean' &&
    typeof dados.espacamento === 'boolean' &&
    typeof dados.modoFoco === 'boolean' &&
    typeof dados.fonteLegivel === 'boolean' &&
    typeof dados.guiaLeitura === 'boolean' &&
    ['nenhuma', 'protanopia', 'deuteranopia', 'tritanopia'].includes(String(dados.simulacaoCores))
  )
}

export function AcessibilidadeProvider({ children }: AcessibilidadeContextProps) {
  const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(() => {
    const salvas = carregar<PreferenciasAcessibilidade>(CHAVE_ACESSIBILIDADE)
    return preferenciaValida(salvas) ? salvas : preferenciasPadrao
  })

  useEffect(() => {
    const raiz = document.documentElement
    raiz.style.fontSize = `${preferencias.tamanhoTexto}%`
    raiz.dataset.contraste = preferencias.contrasteAlto ? 'alto' : 'normal'
    raiz.dataset.espacamento = preferencias.espacamento ? 'ampliado' : 'normal'
    raiz.dataset.modoFoco = preferencias.modoFoco ? 'ativo' : 'inativo'
    raiz.dataset.fonte = preferencias.fonteLegivel ? 'legivel' : 'padrao'
    raiz.dataset.simulacaoCores = preferencias.simulacaoCores
    salvar(CHAVE_ACESSIBILIDADE, preferencias)
  }, [preferencias])

  // Evita renderizações dos consumidores sem alteração no valor do contexto.
  const valor = useMemo<ValorAcessibilidade>(() => ({
    preferencias,
    alterar: (alteracoes) => setPreferencias((atuais) => ({ ...atuais, ...alteracoes })),
    restaurar: () => setPreferencias(preferenciasPadrao),
  }), [preferencias])

  return <AcessibilidadeContext.Provider value={valor}>{children}</AcessibilidadeContext.Provider>
}
