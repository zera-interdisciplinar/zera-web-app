import { useCallback, useState } from 'react'
import { Button } from '../../components/Button'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import { obterConfiguracoes, salvarConfiguracoes } from '../../services/configuracaoService'
import { mensagemDeErro } from '../../types/api'
import type { Configuracoes } from '../../types/configuracao'
import { validarConfiguracoes } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from './ConfiguracoesPage.module.css'
import { modoDemonstracao } from '../../services/apiReal'
import { obterCapacidade } from '../../services/cicloService'
import type { UnitSettingsResponse } from '../../types/apiReal'

interface FormConfiguracoes {
  diasLoteCritico: string
  metaCircularidade: string
}

export default function ConfiguracoesPage() {
  const buscar = useCallback((sinal: AbortSignal) => obterConfiguracoes(sinal), [])
  const configuracoes = useRequisicao<Configuracoes>(buscar, modoDemonstracao)
  const buscarCapacidade = useCallback((sinal: AbortSignal) => obterCapacidade(sinal), [])
  const capacidade = useRequisicao<UnitSettingsResponse>(buscarCapacidade, !modoDemonstracao)
  const [toast, mostrarToast] = useToast()

  const [form, setForm] = useState<FormConfiguracoes | null>(null)
  const [erros, setErros] = useState<ErrosDeCampo<Configuracoes>>({})
  const [salvando, setSalvando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const [formInicializado, setFormInicializado] = useState(false)
  if (configuracoes.dados && !formInicializado) {
    setFormInicializado(true)
    setForm({
      diasLoteCritico: String(configuracoes.dados.diasLoteCritico),
      metaCircularidade: String(configuracoes.dados.metaCircularidade),
    })
  }

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!form) return
    setErroEnvio(null)

    const candidato: Configuracoes = {
      diasLoteCritico: Number(form.diasLoteCritico),
      metaCircularidade: Number(form.metaCircularidade),
    }

    const validacao = validarConfiguracoes(candidato)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setSalvando(true)
    try {
      await salvarConfiguracoes(validacao.dados)
      mostrarToast('Parâmetros salvos. Os alertas de lote passam a usar os novos limites.')
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <PageHeader
        titulo="Configurações"
        subtitulo="Parâmetros que regem alertas e metas do sistema."
      />
      {!modoDemonstracao && <section className={estilos.cartao} aria-label="Capacidade da unidade">
        <h2>Capacidade de estoque</h2>
        {capacidade.carregando && <Skeleton descricao="Consultando capacidade." linhas={2} />}
        {capacidade.erro && <EstadoErro mensagem={capacidade.erro} aoTentarNovamente={capacidade.recarregar} />}
        {capacidade.dados && <p role="status">{capacidade.dados.configured ? `${capacidade.dados.stockCapacity} itens` : 'Capacidade não configurada.'}</p>}
        <p>Os parâmetros de lote crítico e circularidade não estão disponíveis neste contrato.</p>
      </section>}

      {(import.meta.env.VITE_ADMIN_OPENAPI_URL || import.meta.env.VITE_INVENTORY_OPENAPI_URL) && (
        <section className={estilos.cartao} aria-labelledby="titulo-contratos">
          <h2 className="titulo-card" id="titulo-contratos">Contratos das APIs</h2>
          <p>Documentação pública dos serviços; o acesso aos dados continua sujeito à autenticação.</p>
          <ul>
            {import.meta.env.VITE_ADMIN_OPENAPI_URL && <li><a href={import.meta.env.VITE_ADMIN_OPENAPI_URL} target="_blank" rel="noopener noreferrer">OpenAPI administrativo</a></li>}
            {import.meta.env.VITE_INVENTORY_OPENAPI_URL && <li><a href={import.meta.env.VITE_INVENTORY_OPENAPI_URL} target="_blank" rel="noopener noreferrer">OpenAPI de inventário</a></li>}
          </ul>
        </section>
      )}

      {configuracoes.carregando && <Skeleton descricao="Carregando os parâmetros do sistema." linhas={3} />}
      {configuracoes.erro && (
        <EstadoErro mensagem={configuracoes.erro} aoTentarNovamente={configuracoes.recarregar} />
      )}

      {form && (
        <section className={estilos.cartao} aria-labelledby="titulo-parametros">
          <h2 className="titulo-card" id="titulo-parametros">
            Parâmetros do sistema
          </h2>

          <form onSubmit={aoSalvar} noValidate>
            <div className={estilos.campos}>
              <FieldCard
                id="dias-lote-critico"
                rotulo="Dias para lote crítico"
                tipo="numero"
                valor={form.diasLoteCritico}
                aoMudar={(valor) => setForm((atual) => atual && { ...atual, diasLoteCritico: valor })}
                erro={erros.diasLoteCritico}
                desabilitado={salvando}
              />
              <FieldCard
                id="meta-circularidade"
                rotulo="Meta anual de circularidade (%)"
                tipo="numero"
                valor={form.metaCircularidade}
                aoMudar={(valor) =>
                  setForm((atual) => atual && { ...atual, metaCircularidade: valor })
                }
                erro={erros.metaCircularidade}
                desabilitado={salvando}
              />
            </div>

            {erroEnvio && (
              <p className={estilos.erro} role="alert">
                {erroEnvio}
              </p>
            )}

            <div className={estilos.acoes}>
              <Button variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </section>
      )}

      <Toast mensagem={toast} />
    </>
  )
}
