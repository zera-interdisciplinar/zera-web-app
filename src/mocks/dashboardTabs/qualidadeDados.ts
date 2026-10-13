// TODO(contrato): os Swaggers não confirmam estes campos nem métricas de qualidade.
// Cada registro abaixo é uma suposição explícita, consumida somente em modo demo.
const camposDemo = [
  { chave: 'anoFabricacao', campo: 'Ano de fabricação' },
  { chave: 'dataCadastro', campo: 'Data de cadastro' },
  { chave: 'garantia', campo: 'Garantia (meses)' },
  { chave: 'peso', campo: 'Peso estimado (kg)' },
  { chave: 'vidaUtil', campo: 'Vida útil estimada (meses)' },
] as const

export const qualidadeDadosDemo = {
  campos: camposDemo,
  situacoes: ['Aguardando aprovação', 'Descartado', 'Em estoque', 'Em manutenção', 'Em avaliação', 'Removido'],
  categorias: ['Notebook'],
  unidades: [{ id: 'unit-centro', nome: 'Unidade Centro' }, { id: 'unit-norte', nome: 'Unidade Norte' }],
  registros: Array.from({ length: 32 }, (_, indice) => ({
    id: indice + 1,
    situacao: ['Aguardando aprovação', 'Em estoque', 'Em manutenção', 'Descartado'][indice % 4],
    categoria: 'Notebook',
    unidadeId: indice % 2 === 0 ? 'unit-centro' : 'unit-norte',
    alertaTipo: indice < 3 ? 'Item aprovado' : null,
    intensidadeUso: indice < 12 ? 3 : 5,
    preenchimento: {
      anoFabricacao: true,
      dataCadastro: true,
      garantia: indice % 8 !== 0,
      peso: indice % 8 !== 0,
      vidaUtil: indice % 8 !== 0,
    },
  })),
} as const
