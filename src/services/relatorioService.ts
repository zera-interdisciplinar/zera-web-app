import type {
  NovaRecicladora,
  PreviaRelatorio,
  Recicladora,
  Relatorio,
} from '../types/relatorio'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'

interface RecyclingBusiness {
  id: string
  name: string
  cnpj: string
  email: string
}

function mapearRecicladora(dado: RecyclingBusiness): Recicladora {
  return { id: dado.id, nome: dado.name, cnpj: dado.cnpj, cidade: '', email: dado.email }
}

export async function listarRecicladoras(sinal?: AbortSignal): Promise<Recicladora[]> {
  try {
    if (!modoDemonstracao) return (await requisitarApiReal<RecyclingBusiness[]>('administrative', '/api/v1/recyclings', { sinal })).map(mapearRecicladora)
    return await requisitar<Recicladora[]>('/recyclers', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar as cooperativas.')
  }
}

export async function criarRecicladora(nova: NovaRecicladora): Promise<Recicladora> {
  try {
    if (!modoDemonstracao) {
      const dado = await requisitarApiReal<RecyclingBusiness>('administrative', '/api/v1/recyclings', {
        metodo: 'POST', corpo: { name: nova.nome, cnpj: nova.cnpj.replace(/\D/g, ''), email: nova.email },
      })
      return mapearRecicladora(dado)
    }
    return await requisitar<Recicladora>('/recyclers', { metodo: 'POST', corpo: nova })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar a cooperativa.')
  }
}

export async function listarRelatorios(sinal?: AbortSignal): Promise<Relatorio[]> {
  try {
    if (!modoDemonstracao) throw new Error('A API oferece registros de descarte, não relatórios enviados. Esta lista não tem contrato correspondente.')
    return await requisitar<Relatorio[]>('/disposal-reports', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os relatórios.')
  }
}

export async function gerarPrevia(sinal?: AbortSignal): Promise<PreviaRelatorio> {
  try {
    if (!modoDemonstracao) throw new Error('Não existe endpoint documentado para prévia de relatório de descarte.')
    return await requisitar<PreviaRelatorio>('/disposal-reports/preview', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível gerar a prévia do relatório.')
  }
}

export interface EnvioRelatorioPayload {
  recicladoraId: number
  produtoIds: Array<number | string>
}

export async function enviarRelatorio(payload: EnvioRelatorioPayload): Promise<Relatorio> {
  try {
    if (!modoDemonstracao) throw new Error('Não existe endpoint documentado para enviar relatório à cooperativa.')
    return await requisitar<Relatorio>('/disposal-reports', { metodo: 'POST', corpo: payload })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível enviar o relatório.')
  }
}
