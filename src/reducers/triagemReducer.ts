import type { Classificacao } from '../types/produto'

export type EtapaTriagem = 'classificacao' | 'periculosidade' | 'confirmacao' | 'concluida'

export const ITENS_CHECKLIST: string[] = [
  'Terminais isolados com fita e sem sinal de vazamento',
  'Sem estufamento, trinca ou deformação na carcaça',
  'Armazenado em contentor de resíduo classe I',
  'Ficha de segurança do fabricante anexada ao lote',
]

interface DadosTriagem {
  classificacao: Classificacao | null
  checklist: Record<string, boolean>
  enviando: boolean
  erro: string | null
}

export type EstadoTriagem = DadosTriagem & (
  | { etapa: 'classificacao' }
  | { etapa: 'periculosidade' }
  | { etapa: 'confirmacao' }
  | { etapa: 'concluida' }
)

export type AcaoTriagem =
  | { tipo: 'classificar'; classificacao: Classificacao }
  | { tipo: 'alternar-checklist'; item: string }
  | { tipo: 'avancar'; exigeChecklist: boolean }
  | { tipo: 'voltar'; exigeChecklist: boolean }
  | { tipo: 'envio-iniciado' }
  | { tipo: 'envio-concluido' }
  | { tipo: 'envio-falhou'; mensagem: string }

export const estadoInicialTriagem: EstadoTriagem = {
  etapa: 'classificacao',
  classificacao: null,
  checklist: {},
  enviando: false,
  erro: null,
}

function checklistCompleto(estado: EstadoTriagem): boolean {
  return ITENS_CHECKLIST.every((item) => estado.checklist[item] === true)
}

export function triagemReducer(estado: EstadoTriagem, acao: AcaoTriagem): EstadoTriagem {
  switch (acao.tipo) {
    case 'classificar':
      return { ...estado, classificacao: acao.classificacao, erro: null }

    case 'alternar-checklist':
      return {
        ...estado,
        checklist: { ...estado.checklist, [acao.item]: !estado.checklist[acao.item] },
      }

    case 'avancar': {
      if (estado.etapa === 'classificacao') {
        if (estado.classificacao === null) {
          return { ...estado, erro: 'Escolha uma classificação para o item antes de seguir.' }
        }
        const precisaChecklist = acao.exigeChecklist && estado.classificacao === 'descartavel'
        return { ...estado, etapa: precisaChecklist ? 'periculosidade' : 'confirmacao', erro: null }
      }
      if (estado.etapa === 'periculosidade') {
        if (!checklistCompleto(estado)) {
          return {
            ...estado,
            erro: 'Marque todos os itens do checklist antes de seguir. Bateria não sai do galpão sem conferência.',
          }
        }
        return { ...estado, etapa: 'confirmacao', erro: null }
      }
      return estado
    }

    case 'voltar': {
      if (estado.etapa === 'confirmacao') {
        const passouPorChecklist = acao.exigeChecklist && estado.classificacao === 'descartavel'
        return { ...estado, etapa: passouPorChecklist ? 'periculosidade' : 'classificacao', erro: null }
      }
      if (estado.etapa === 'periculosidade') {
        return { ...estado, etapa: 'classificacao', erro: null }
      }
      return estado
    }

    case 'envio-iniciado':
      return { ...estado, enviando: true, erro: null }

    case 'envio-concluido':
      return { ...estado, enviando: false, etapa: 'concluida', erro: null }

    case 'envio-falhou':
      return { ...estado, enviando: false, erro: acao.mensagem }

    default:
      return estado
  }
}
