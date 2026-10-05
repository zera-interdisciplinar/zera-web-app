// TODO(contrato): os Swaggers não confirmam estas associações nem classificações.
// Itens, materiais, classes e quantidades são suposições explícitas para modo demo.
const distribuicaoMateriais = [
  { material: 'Metal', quantidade: 18 },
  { material: 'Outros', quantidade: 7 },
  { material: 'Pilhas e baterias', quantidade: 11 },
  { material: 'Plástico (eletrônicos)', quantidade: 14 },
  { material: 'Plástico', quantidade: 19 },
  { material: 'Têxteis', quantidade: 10 },
  { material: 'Vidro', quantidade: 6 },
] as const

const itens = Array.from({ length: 41 }, (_, indice) => ({
  id: indice + 1,
  condicao: indice < 23 ? 'Novo' : 'Usado',
  reciclavel: indice < 31,
  perigoso: indice >= 36,
}))

const associacoes = distribuicaoMateriais.flatMap(({ material, quantidade }, indiceMaterial) =>
  Array.from({ length: quantidade }, (_, indiceAssociacao) => {
    const idItem = ((indiceMaterial * 17 + indiceAssociacao * 3) % itens.length) + 1
    return {
      idItem,
      material,
      reciclavel: !(material === 'Outros' || (material === 'Metal' && indiceAssociacao === 0)),
      perigoso:
        material === 'Pilhas e baterias' ||
        (material === 'Outros' && indiceAssociacao < 3) ||
        (material === 'Metal' && indiceAssociacao < 4),
    }
  }),
)

export const materiaisSustentabilidadeDemo = {
  condicoes: ['Novo', 'Usado'],
  itens,
  associacoes,
}
