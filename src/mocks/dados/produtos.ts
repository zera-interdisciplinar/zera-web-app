import type { Manutencao } from '../../types/manutencao'
import type { Classificacao, Condicao, Produto } from '../../types/produto'
import { montarCodigoBarras } from '../../utils/formatacao'
import { categorias, modelos, responsaveis } from './catalogo'

function gerador(semente: number): () => number {
  let estado = semente
  return () => {
    estado |= 0
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TOTAL_ITENS = 120
const CONDICOES: Condicao[] = ['novo', 'usado', 'danificado']
const CLASSIFICACOES: Classificacao[] = ['reutilizavel', 'aproveitavel', 'descartavel']

function dataIsoHaDias(dias: number): string {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  data.setDate(data.getDate() - dias)
  return data.toISOString().slice(0, 10)
}

function dataHoraIsoHaHoras(horas: number): string {
  return new Date(Date.now() - horas * 3_600_000).toISOString()
}

export function gerarProdutos(): Produto[] {
  const aleatorio = gerador(20260915)
  const produtos: Produto[] = []

  for (let indice = 0; indice < TOTAL_ITENS; indice += 1) {
    const modelo = modelos[Math.floor(aleatorio() * modelos.length)]
    const categoria = categorias.find((item) => item.id === modelo.categoriaId)
    if (!categoria) continue

    const id = 1_000 + indice
    const tetoDias = categoria.id === 4 ? 140 : categoria.id === 6 ? 130 : 220
    const diasEmEstoque = Math.floor(aleatorio() * tetoDias)

    const sorteioTriagem = aleatorio()
    const triado = sorteioTriagem > 0.35
    const classificacao: Classificacao | null = triado
      ? CLASSIFICACOES[
          Math.floor(
            (categoria.id === 4 ? 0.65 + aleatorio() * 0.35 : aleatorio()) * CLASSIFICACOES.length,
          ) % CLASSIFICACOES.length
        ]
      : null

    produtos.push({
      id,
      nome: `${modelo.nome}`,
      categoriaId: categoria.id,
      marca: modelo.fabricante,
      condicao: CONDICOES[Math.floor(aleatorio() * CONDICOES.length)],
      codigoBarras: montarCodigoBarras(id, categoria.codigo),
      responsavel: responsaveis[Math.floor(aleatorio() * responsaveis.length)],
      dataEntrada: dataIsoHaDias(diasEmEstoque),
      atualizacao: dataHoraIsoHaHoras(Math.floor(aleatorio() * 24 * 21)),
      classificacao,
      statusTriagem: triado ? 'classificado' : 'aguardando',
    })
  }

  return produtos
}

const TECNICOS = ['Aline Ferraz', 'Douglas Beltrão', 'Kelly Nakamura', 'Sérgio Vidal']
const DESCRICOES: Record<string, string[]> = {
  preventiva: [
    'Limpeza interna, troca de pasta térmica e teste de carga.',
    'Inspeção visual de conectores e reaperto de parafusos.',
    'Teste de ciclo de carga da bateria e medição de tensão.',
  ],
  corretiva: [
    'Substituição da fonte de alimentação queimada.',
    'Troca de dobradiça da tampa e recolocação do flat da tela.',
    'Reposicionamento do pente de memória com mau contato.',
  ],
}

export function gerarManutencoes(produtos: Produto[]): Manutencao[] {
  const aleatorio = gerador(778_311)
  const manutencoes: Manutencao[] = []
  let id = 1

  for (const produto of produtos) {
    if (aleatorio() > 0.4) continue
    const quantidade = 1 + Math.floor(aleatorio() * 3)
    for (let i = 0; i < quantidade; i += 1) {
      const tipo = aleatorio() > 0.45 ? 'preventiva' : 'corretiva'
      const opcoes = DESCRICOES[tipo]
      manutencoes.push({
        id,
        produtoId: produto.id,
        data: dataIsoHaDias(30 + i * 150 + Math.floor(aleatorio() * 60)),
        tipo,
        descricao: opcoes[Math.floor(aleatorio() * opcoes.length)],
        tecnico: TECNICOS[Math.floor(aleatorio() * TECNICOS.length)],
      })
      id += 1
    }
  }

  return manutencoes
}
