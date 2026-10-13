// TODO(contrato): os Swaggers não confirmam estas associações nem classificações.
// Itens, materiais, classes e quantidades são suposições explícitas para modo demo.
const distribuicaoMateriais = [
  { material: 'Metal', quantidade: 22 },
  { material: 'Outros', quantidade: 2 },
  { material: 'Pilhas e baterias', quantidade: 8 },
  { material: 'Plástico (eletrônicos)', quantidade: 22 },
  { material: 'Plástico', quantidade: 26 },
  { material: 'Têxteis', quantidade: 16 },
  { material: 'Vidro', quantidade: 8 },
] as const

const itens = Array.from({ length: 32 }, (_, indice) => ({
  id: indice + 1,
  condicao: indice < 20 ? 'Novo' : 'Usado',
  reciclavel: indice < 30,
  perigoso: indice < 30,
}))

const associacoes = distribuicaoMateriais.flatMap(({ material, quantidade }, indiceMaterial) =>
  Array.from({ length: quantidade }, (_, indiceAssociacao) => {
    const idItem = ((indiceMaterial * 13 + indiceAssociacao) % itens.length) + 1
    return {
      idItem,
      material,
      reciclavel: !(material === 'Outros' || (material === 'Metal' && indiceAssociacao === 0)),
      perigoso:
        material === 'Pilhas e baterias' ||
        (material === 'Outros' && indiceAssociacao === 0) ||
        (material === 'Metal' && indiceAssociacao < 20),
    }
  }),
)

export const materiaisSustentabilidadeDemo = {
  condicoes: ['Novo', 'Usado'],
  itens,
  associacoes,
}
