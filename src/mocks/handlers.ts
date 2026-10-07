import { HttpResponse, http, delay } from 'msw'

import type { AlertaLote } from '../types/alerta'
import type { Categoria, NovaCategoria } from '../types/categoria'
import type { Configuracoes } from '../types/configuracao'
import type { ResumoDashboard } from '../types/dashboard'
import type { AnalisePreventiva, FatorAnalise, Manutencao, NovaManutencao } from '../types/manutencao'
import type { Modelo, NovoModelo } from '../types/modelo'
import type {
  NovoProduto,
  Produto,
  ProdutoDetalhado,
  StatusItem,
} from '../types/produto'
import type { ItemRelatorio, NovaRecicladora, Relatorio } from '../types/relatorio'
import type { Perfil, NovoUsuario, SessaoAutenticada, Usuario } from '../types/usuario'
import { diasDesde, montarCodigoBarras } from '../utils/formatacao'
import {

  categorias as categoriasIniciais,
  modelos as modelosIniciais,
  recicladoras as recicladorasIniciais,
  usuarios as usuariosIniciais,
} from './dados/catalogo'
import { gerarManutencoes, gerarProdutos } from './dados/produtos'
import type { ResultadoTriagem } from '../services/produtoService'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

const banco = {
  categorias: [...categoriasIniciais] as Categoria[],
  modelos: [...modelosIniciais] as Modelo[],
  produtos: gerarProdutos() as Produto[],
  manutencoes: [] as Manutencao[],
  recicladoras: [...recicladorasIniciais],
  usuarios: [...usuariosIniciais] as Usuario[],
  relatorios: [
    {
      id: 3,
      criadoEm: '2026-08-28T10:15:00',
      periodo: 'ago/2026',
      status: 'enviado',
      recicladoraNome: 'Cooperativa Recicla Vale',
      totalItens: 36,
    },
    {
      id: 2,
      criadoEm: '2026-07-30T15:40:00',
      periodo: 'jul/2026',
      status: 'enviado',
      recicladoraNome: 'Eco Descarte Ambiental',
      totalItens: 52,
    },
    {
      id: 1,
      criadoEm: '2026-06-25T09:05:00',
      periodo: 'jun/2026',
      status: 'enviado',
      recicladoraNome: 'Coopermetal Reversa',
      totalItens: 41,
    },
  ] as Relatorio[],
  configuracoes: { diasLoteCritico: 90, metaCircularidade: 75 } as Configuracoes,
}
banco.manutencoes = gerarManutencoes(banco.produtos)

function statusDo(produto: Produto): StatusItem {
  if (produto.statusTriagem === 'aguardando') return 'em-aprovacao'
  if (produto.classificacao === 'reutilizavel') return 'reutilizavel'
  if (produto.classificacao === 'aproveitavel') return 'aproveitavel'
  if (produto.classificacao === 'descartavel') {
    const categoria = banco.categorias.find((item) => item.id === produto.categoriaId)
    const limite = categoria?.diasLimiteDescarte ?? banco.configuracoes.diasLoteCritico
    return diasDesde(produto.dataEntrada) >= limite ? 'lote-critico' : 'descartavel'
  }
  return 'em-estoque'
}

function detalhar(produto: Produto): ProdutoDetalhado {
  const categoria = banco.categorias.find((item) => item.id === produto.categoriaId)
  return {
    ...produto,
    categoriaNome: categoria?.nome ?? 'Categoria removida',
    status: statusDo(produto),
    diasEmEstoque: diasDesde(produto.dataEntrada),
  }
}

function calcularAlertas(): AlertaLote[] {
  const alertas: AlertaLote[] = []

  for (const categoria of banco.categorias) {
    const criticos = banco.produtos.filter(
      (produto) => produto.categoriaId === categoria.id && statusDo(produto) === 'lote-critico',
    )
    if (criticos.length === 0) continue

    alertas.push({
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      quantidadeItens: criticos.length,
      diasMaisAntigo: Math.max(...criticos.map((produto) => diasDesde(produto.dataEntrada))),
      diasLimite: categoria.diasLimiteDescarte ?? banco.configuracoes.diasLoteCritico,
    })
  }

  return alertas.sort((a, b) => b.quantidadeItens - a.quantidadeItens)
}

function resumoDashboard(): ResumoDashboard {
  return {
    kpis: {
      itensCadastrados: 1230,
      deltaItens: '+12% este mês',
      taxaReciclagem: 68,
      deltaReciclagem: '+4,5% no período',
      aguardandoAprovacao: 42,
      prioritarios: 8,
      impactoToneladas: 3.1,
    },
    serie: [
      { mes: 'Mar', total: 95, atual: false },
      { mes: 'Abr', total: 130, atual: false },
      { mes: 'Mai', total: 105, atual: false },
      { mes: 'Jun', total: 165, atual: false },
      { mes: 'Jul', total: 140, atual: false },
      { mes: 'Ago', total: 200, atual: true },
    ],
    circularidade: { percentual: 68, meta: banco.configuracoes.metaCircularidade },
  }
}

function analisar(produto: Produto): AnalisePreventiva {
  const corretivas = banco.manutencoes.filter(
    (item) => item.produtoId === produto.id && item.tipo === 'corretiva',
  ).length
  const ultima = banco.manutencoes
    .filter((item) => item.produtoId === produto.id)
    .map((item) => item.data)
    .sort()
    .at(-1)
  const diasSemManutencao = ultima ? diasDesde(ultima) : null
  const fatores: FatorAnalise[] = []

  fatores.push({
    rotulo: 'Condição registrada',
    detalhe: `Item cadastrado como ${produto.condicao} na entrada.`,
    pontos: produto.condicao === 'danificado' ? 3 : produto.condicao === 'usado' ? 1 : 0,
  })

  fatores.push({
    rotulo: 'Manutenções corretivas',
    detalhe:
      corretivas === 0
        ? 'Nenhuma corretiva registrada.'
        : `${corretivas} corretiva(s) no histórico do item.`,
    pontos: corretivas >= 3 ? 3 : corretivas === 2 ? 2 : corretivas === 1 ? 1 : 0,
  })

  fatores.push({
    rotulo: 'Intervalo desde a última manutenção',
    detalhe:
      diasSemManutencao === null
        ? 'Nunca passou por manutenção registrada.'
        : `${diasSemManutencao} dias desde o último atendimento.`,
    pontos: diasSemManutencao === null ? 2 : diasSemManutencao > 360 ? 2 : diasSemManutencao > 180 ? 1 : 0,
  })

  fatores.push({
    rotulo: 'Permanência em estoque',
    detalhe: `${diasDesde(produto.dataEntrada)} dias parado desde a entrada.`,
    pontos: diasDesde(produto.dataEntrada) > 120 ? 2 : diasDesde(produto.dataEntrada) > 60 ? 1 : 0,
  })

  const pontuacao = fatores.reduce((total, fator) => total + fator.pontos, 0)
  const risco = pontuacao >= 7 ? 'alto' : pontuacao >= 4 ? 'medio' : 'baixo'

  return {
    produtoId: produto.id,
    risco,
    pontuacao,
    fatores,
    recomendacao:
      risco === 'alto'
        ? 'Priorizar triagem para descarte: o custo de recuperação tende a superar o valor do equipamento.'
        : risco === 'medio'
          ? 'Agendar manutenção preventiva antes de devolver o item ao uso.'
          : 'Item apto a reuso. Reavaliar na próxima janela de inspeção.',
  }
}

function itensParaDescarte(): ItemRelatorio[] {
  return banco.produtos
    .filter((produto) => produto.classificacao === 'descartavel' && produto.statusTriagem !== 'descartado')
    .map((produto) => {
      const detalhado = detalhar(produto)
      return {
        produtoId: produto.id,
        codigoBarras: produto.codigoBarras,
        descricao: `${produto.marca} ${produto.nome}`,
        categoriaNome: detalhado.categoriaNome,
        diasEmEstoque: detalhado.diasEmEstoque,
      }
    })
    .sort((a, b) => b.diasEmEstoque - a.diasEmEstoque)
    .slice(0, 40)
}

export const handlers = [
  http.post(`${BASE}/auth/demo`, async ({ request }) => {
    await delay(420)
    const entrada = (await request.json()) as { perfil?: Perfil }
    const usuario = banco.usuarios.find((item) => item.perfil === entrada.perfil)
    if (!usuario) return HttpResponse.json({ mensagem: 'Selecione um perfil para explorar a demonstração.' }, { status: 400 })
    const expiraEm = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    const sessao: SessaoAutenticada = { usuario, expiraEm }
    return HttpResponse.json(sessao)
  }),

  http.get(`${BASE}/categories`, async () => {
    await delay(220)
    return HttpResponse.json(banco.categorias)
  }),

  http.post(`${BASE}/categories`, async ({ request }) => {
    await delay(260)
    const nova = (await request.json()) as NovaCategoria
    const id = banco.categorias.length + 1
    const categoria: Categoria = { id, codigo: String(id).padStart(2, '0'), ...nova }
    banco.categorias = [...banco.categorias, categoria]
    return HttpResponse.json(categoria, { status: 201 })
  }),

  http.get(`${BASE}/models`, async () => {
    await delay(220)
    return HttpResponse.json(
      banco.modelos.map((modelo) => ({
        ...modelo,
        categoriaNome:
          banco.categorias.find((categoria) => categoria.id === modelo.categoriaId)?.nome ?? '—',
      })),
    )
  }),

  http.post(`${BASE}/models`, async ({ request }) => {
    await delay(300)
    const novo = (await request.json()) as NovoModelo
    const modelo: Modelo = { id: banco.modelos.length + 1, ...novo }
    banco.modelos = [...banco.modelos, modelo]
    return HttpResponse.json(modelo, { status: 201 })
  }),

  http.get(`${BASE}/items`, async () => {
    await delay(380)
    return HttpResponse.json(
      banco.produtos
        .filter((produto) => produto.statusTriagem !== 'descartado')
        .map(detalhar)
        .sort((a, b) => b.atualizacao.localeCompare(a.atualizacao)),
    )
  }),

  http.get(`${BASE}/items/:id`, async ({ params }) => {
    await delay(300)
    const produto = banco.produtos.find((item) => item.id === Number(params.id))
    if (!produto) {
      return HttpResponse.json({ mensagem: 'Item não encontrado no inventário.' }, { status: 404 })
    }
    return HttpResponse.json(detalhar(produto))
  }),

  http.post(`${BASE}/items`, async ({ request }) => {
    await delay(500)
    const novo = (await request.json()) as NovoProduto
    const categoria = banco.categorias.find((item) => item.id === novo.categoriaId)
    if (!categoria) {
      return HttpResponse.json(
        { mensagem: 'Categoria inexistente.', campo: 'categoriaId' },
        { status: 422 },
      )
    }

    const id = Math.max(...banco.produtos.map((item) => Number(item.id))) + 1
    const agora = new Date()
    const produto: Produto = {
      id,
      nome: novo.nome,
      categoriaId: novo.categoriaId,
      marca: novo.marca,
      condicao: novo.condicao,
      codigoBarras: montarCodigoBarras(id, categoria.codigo),
      responsavel: 'Natalia Flores',
      dataEntrada: agora.toISOString().slice(0, 10),
      atualizacao: agora.toISOString(),
      classificacao: null,
      statusTriagem: 'aguardando',
    }
    banco.produtos = [produto, ...banco.produtos]
    return HttpResponse.json(detalhar(produto), { status: 201 })
  }),

  http.put(`${BASE}/items/:id`, async ({ request, params }) => {
    await delay(420)
    const dados = (await request.json()) as NovoProduto
    const indice = banco.produtos.findIndex((item) => item.id === Number(params.id))
    if (indice < 0) {
      return HttpResponse.json({ mensagem: 'Item não encontrado.' }, { status: 404 })
    }
    const atualizado: Produto = {
      ...banco.produtos[indice],
      nome: dados.nome,
      categoriaId: dados.categoriaId,
      marca: dados.marca,
      condicao: dados.condicao,
      atualizacao: new Date().toISOString(),
    }
    banco.produtos = banco.produtos.map((item, posicao) => (posicao === indice ? atualizado : item))
    return HttpResponse.json(detalhar(atualizado))
  }),

  http.delete(`${BASE}/items/:id`, async ({ params }) => {
    await delay(380)
    const existe = banco.produtos.some((item) => item.id === Number(params.id))
    if (!existe) {
      return HttpResponse.json({ mensagem: 'Item não encontrado.' }, { status: 404 })
    }
    banco.produtos = banco.produtos.filter((item) => item.id !== Number(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/items/:id/triage`, async ({ request, params }) => {
    await delay(460)
    const resultado = (await request.json()) as ResultadoTriagem
    const indice = banco.produtos.findIndex((item) => item.id === Number(params.id))
    if (indice < 0) {
      return HttpResponse.json({ mensagem: 'Item não encontrado.' }, { status: 404 })
    }
    const atualizado: Produto = {
      ...banco.produtos[indice],
      classificacao: resultado.classificacao,
      statusTriagem: 'classificado',
      responsavel: resultado.responsavel,
      atualizacao: new Date().toISOString(),
    }
    banco.produtos = banco.produtos.map((item, posicao) => (posicao === indice ? atualizado : item))
    return HttpResponse.json(detalhar(atualizado))
  }),

  http.get(`${BASE}/items/:id/maintenances`, async ({ params }) => {
    await delay(280)
    const lista = banco.manutencoes
      .filter((item) => item.produtoId === Number(params.id))
      .sort((a, b) => b.data.localeCompare(a.data))
    return HttpResponse.json(lista)
  }),

  http.post(`${BASE}/items/:id/maintenances`, async ({ request }) => {
    await delay(380)
    const nova = (await request.json()) as NovaManutencao
    const manutencao: Manutencao = {
      id: banco.manutencoes.length + 1,
      produtoId: nova.produtoId,
      data: new Date().toISOString().slice(0, 10),
      tipo: nova.tipo,
      descricao: nova.descricao,
      tecnico: nova.tecnico,
    }
    banco.manutencoes = [manutencao, ...banco.manutencoes]
    return HttpResponse.json(manutencao, { status: 201 })
  }),

  http.get(`${BASE}/items/:id/preventive-analysis`, async ({ params }) => {
    await delay(320)
    const produto = banco.produtos.find((item) => item.id === Number(params.id))
    if (!produto) {
      return HttpResponse.json({ mensagem: 'Item não encontrado.' }, { status: 404 })
    }
    return HttpResponse.json(analisar(produto))
  }),

  http.get(`${BASE}/dashboard/summary`, async () => {
    await delay(340)
    return HttpResponse.json(resumoDashboard())
  }),

  http.get(`${BASE}/alerts/batches`, async () => {
    await delay(300)
    return HttpResponse.json(calcularAlertas())
  }),

  http.get(`${BASE}/recyclers`, async () => {
    await delay(200)
    return HttpResponse.json(banco.recicladoras)
  }),

  http.post(`${BASE}/recyclers`, async ({ request }) => {
    await delay(300)
    const nova = (await request.json()) as NovaRecicladora
    const recicladora = { id: banco.recicladoras.length + 1, ...nova }
    banco.recicladoras = [...banco.recicladoras, recicladora]
    return HttpResponse.json(recicladora, { status: 201 })
  }),

  http.get(`${BASE}/users`, async () => {
    await delay(240)
    return HttpResponse.json(banco.usuarios)
  }),

  http.post(`${BASE}/users`, async ({ request }) => {
    await delay(320)
    const novo = (await request.json()) as NovoUsuario
    if (banco.usuarios.some((item) => item.email === novo.email)) {
      return HttpResponse.json(
        { mensagem: 'Já existe um funcionário com esse e-mail.', campo: 'email' },
        { status: 409 },
      )
    }
    const usuario: Usuario = { id: banco.usuarios.length + 1, ...novo }
    banco.usuarios = [...banco.usuarios, usuario]
    return HttpResponse.json(usuario, { status: 201 })
  }),

  http.get(`${BASE}/settings`, async () => {
    await delay(200)
    return HttpResponse.json(banco.configuracoes)
  }),

  http.put(`${BASE}/settings`, async ({ request }) => {
    await delay(320)
    banco.configuracoes = (await request.json()) as Configuracoes
    return HttpResponse.json(banco.configuracoes)
  }),

  http.get(`${BASE}/disposal-reports`, async () => {
    await delay(280)
    return HttpResponse.json(banco.relatorios)
  }),

  http.get(`${BASE}/disposal-reports/preview`, async () => {
    await delay(520)
    const itens = itensParaDescarte()
    return HttpResponse.json({ itens, totalItens: itens.length })
  }),

  http.post(`${BASE}/disposal-reports`, async ({ request }) => {
    await delay(620)
    const payload = (await request.json()) as { recicladoraId: number; produtoIds: number[] }
    const recicladora = banco.recicladoras.find((item) => item.id === payload.recicladoraId)
    if (!recicladora) {
      return HttpResponse.json(
        { mensagem: 'Cooperativa não cadastrada.', campo: 'recicladoraId' },
        { status: 422 },
      )
    }

    const agora = new Date()
    const relatorio: Relatorio = {
      id: banco.relatorios.length + 1,
      criadoEm: agora.toISOString(),
      periodo: agora
        .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        .replace('.', ''),
      status: 'enviado',
      recicladoraNome: recicladora.nome,
      totalItens: payload.produtoIds.length,
    }

    banco.relatorios = [relatorio, ...banco.relatorios]
    const enviados = new Set<number | string>(payload.produtoIds)
    banco.produtos = banco.produtos.map((item) =>
      enviados.has(item.id) ? { ...item, statusTriagem: 'descartado' } : item,
    )

    return HttpResponse.json(relatorio, { status: 201 })
  }),
]
