import type { CategoryResponse, ItemResponse, ModelResponse } from '../types/apiReal'
import type { Categoria } from '../types/categoria'
import type { Modelo } from '../types/modelo'
import type { Condicao, ProdutoDetalhado, StatusItem } from '../types/produto'
import { ApiError } from '../types/api'
import { interpretarData } from '../utils/formatacao'

const status: Record<ItemResponse['status'], StatusItem> = {
  DRAFT: 'rascunho',
  PENDING_APPROVAL: 'em-aprovacao',
  REJECTED: 'rejeitado',
  IN_STOCK: 'em-estoque',
  IN_USE: 'em-uso',
  IN_MAINTENANCE: 'em-manutencao',
  AWAITING_EVALUATION: 'aguardando-avaliacao',
  DISPOSED: 'descartado',
  REMOVED: 'removido',
}

const condicoes: Record<NonNullable<ItemResponse['condition']>, Condicao> = {
  NEW: 'novo',
  USED: 'usado',
  SEMI_DAMAGED: 'semidanificado',
  DAMAGED: 'danificado',
}

export function mapearCategoria(dado: CategoryResponse): Categoria {
  return {
    id: dado.id,
    codigo: dado.id,
    nome: dado.name,
    descricao: dado.description ?? '',
  }
}

export function mapearModelo(dado: ModelResponse): Modelo {
  return {
    id: dado.id,
    categoriaId: dado.category.id,
    categoriaNome: dado.category.name,
    fabricante: dado.manufacturer,
    nome: dado.name,
    especificacoes: {},
    vidaUtilMeses: dado.expectedLifespanMonths,
    garantiaMeses: dado.warrantyMonths,
    pesoEstimadoKg: dado.estimatedWeightKg,
    materiais: dado.materials.map((material) => material.name),
    aprovacao: dado.approvalStatus,
  }
}

export function mapearItem(dado: ItemResponse): ProdutoDetalhado {
  const criado = interpretarData(dado.createdAt).getTime()
  if (!Number.isFinite(criado)) throw new ApiError('Não conseguimos ler a data de cadastro do item. Tente novamente.', 0)
  const dias = Math.max(0, Math.floor((Date.now() - criado) / 86_400_000))
  return {
    id: dado.id,
    nome: dado.name ?? dado.model?.name ?? 'Item sem nome',
    categoriaId: dado.model?.category.id ?? '',
    categoriaNome: dado.model?.category.name ?? 'Não informada',
    marca: dado.model?.manufacturer ?? 'Não informada',
    condicao: dado.condition ? (condicoes[dado.condition] ?? 'nao-informada') : 'nao-informada',
    codigoBarras: dado.barcode,
    codigoExibicao: dado.displayCode,
    responsavel: dado.createdByName ?? 'Não informado',
    criadoPorId: dado.createdBy,
    dataEntrada: dado.createdAt,
    atualizacao: dado.updatedAt,
    classificacao: null,
    statusTriagem: dado.status === 'DISPOSED' ? 'descartado' : 'aguardando',
    status: status[dado.status] ?? 'nao-informado',
    diasEmEstoque: dias,
  }
}
