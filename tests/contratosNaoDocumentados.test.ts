import { afterEach, describe, expect, it, vi } from 'vitest'
import { listarAlertasDeLote } from '../src/services/alertaService'
import { obterConfiguracoes, salvarConfiguracoes } from '../src/services/configuracaoService'
import { analisarPreventiva, listarManutencoes, registrarManutencao } from '../src/services/manutencaoService'
import { enviarRelatorio, gerarPrevia, listarRelatorios } from '../src/services/relatorioService'
import { modoDemonstracao } from '../src/services/apiReal'

afterEach(() => vi.unstubAllGlobals())

describe('recursos sem endpoint documentado em produção', () => {
  it('mostra erros explícitos e não envia requisições nem preenche dados fictícios', async () => {
    expect(modoDemonstracao).toBe(false)
    const busca = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', busca)

    await expect(listarAlertasDeLote()).rejects.toThrow(/Não foi possível carregar os alertas de lote/i)
    await expect(obterConfiguracoes()).rejects.toThrow(/Não foi possível carregar os parâmetros/i)
    await expect(salvarConfiguracoes({ diasLoteCritico: 30 })).rejects.toThrow(/Não foi possível salvar os parâmetros/i)
    await expect(listarManutencoes('item-de-teste')).rejects.toThrow(/Não foi possível carregar o histórico de manutenções/i)
    await expect(registrarManutencao({ produtoId: 'item-de-teste', tipo: 'preventiva', descricao: 'teste', tecnico: 'teste' }))
      .rejects.toThrow(/Não foi possível registrar a manutenção/i)
    await expect(analisarPreventiva('item-de-teste')).rejects.toThrow(/Não foi possível calcular a análise preventiva/i)
    await expect(listarRelatorios()).rejects.toThrow(/Não foi possível carregar os relatórios/i)
    await expect(gerarPrevia()).rejects.toThrow(/Não foi possível gerar a prévia do relatório/i)
    await expect(enviarRelatorio({ recicladoraId: 1, produtoIds: ['item-de-teste'] }))
      .rejects.toThrow(/Não foi possível enviar o relatório/i)
    expect(busca).not.toHaveBeenCalled()
  })
})
