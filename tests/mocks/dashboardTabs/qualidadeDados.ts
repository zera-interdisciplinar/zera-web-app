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
  categorias: ['Tecnologia', 'Mobiliário', 'Acessórios'],
  unidades: [{ id: 'unit-leste', nome: 'Polo Leste' }, { id: 'unit-sul', nome: 'Polo Sul' }],
  registros: Array.from({ length: 41 }, (_, indice) => ({
    id: indice + 1,
    situacao: ['Aguardando aprovação', 'Em estoque', 'Em manutenção', 'Descartado'][indice % 4],
    categoria: ['Tecnologia', 'Mobiliário', 'Acessórios'][indice % 3],
    unidadeId: indice % 2 === 0 ? 'unit-leste' : 'unit-sul',
    alertaTipo: indice < 6 ? 'Cadastro incompleto' : null,
    intensidadeUso: indice < 18 ? 3 : 5,
    preenchimento: {
      anoFabricacao: true,
      dataCadastro: true,
      garantia: indice % 7 !== 0,
      peso: indice % 6 !== 0,
      vidaUtil: indice % 5 !== 0,
    },
  })),
} as const
