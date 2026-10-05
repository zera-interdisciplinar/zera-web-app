import { Formulario } from '../../components/Formulario'
import { useCallback, useState } from 'react'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useRequisicao } from '../../hooks/useRequisicao'
import { useToast } from '../../hooks/useToast'
import { usePermissoes } from '../../hooks/usePermissoes'
import { obterConfiguracoes, salvarConfiguracoes } from '../../services/configuracaoService'
import { mensagemDeErro } from '../../types/api'
import type { Configuracoes } from '../../types/configuracao'
import { validarConfiguracoes } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from '../../../styles/pages/ConfiguracoesPage/ConfiguracoesPage.module.css'

interface EstadoFormulario {
  diasLoteCritico: string | null
  erros: ErrosDeCampo<Configuracoes>
  salvando: boolean
  erroEnvio: string | null
}

export default function ConfiguracoesPage() {
  const permissoes = usePermissoes()
  const buscar = useCallback((sinal: AbortSignal) => obterConfiguracoes(sinal), [])
  const configuracoes = useRequisicao<Configuracoes>(buscar, permissoes.consultarConfiguracoes)
  const [toast, mostrarToast] = useToast()
  const [estado, setEstado] = useState<EstadoFormulario>({ diasLoteCritico: null, erros: {}, salvando: false, erroEnvio: null })
  const diasLoteCritico = estado.diasLoteCritico ?? String(configuracoes.dados?.diasLoteCritico ?? '')

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!permissoes.consultarConfiguracoes || estado.salvando) return
    const validacao = validarConfiguracoes({ diasLoteCritico: Number(diasLoteCritico) })
    setEstado((atual) => ({ ...atual, erros: validacao.erros, erroEnvio: null }))
    if (!validacao.valido) return
    setEstado((atual) => ({ ...atual, salvando: true }))
    try {
      await salvarConfiguracoes(validacao.dados)
      mostrarToast('Prazo para lote crítico atualizado.')
    } catch (falha: unknown) {
      setEstado((atual) => ({ ...atual, erroEnvio: mensagemDeErro(falha) }))
    } finally {
      setEstado((atual) => ({ ...atual, salvando: false }))
    }
  }

  if (!permissoes.consultarConfiguracoes) return <EmptyState nivelTitulo="h1" titulo="Configurações indisponíveis" descricao="As configurações desta unidade não estão disponíveis nesta área." />
  return <>
    <PageHeader titulo="Configurações" subtitulo="Defina o prazo dos alertas de lote crítico." />
    {configuracoes.carregando && <Skeleton descricao="Carregando os parâmetros do sistema." linhas={3} />}
    {configuracoes.erro && <EstadoErro mensagem={configuracoes.erro} aoTentarNovamente={configuracoes.recarregar} />}
    {configuracoes.dados && <section className={estilos.cartao} aria-labelledby="titulo-parametros">
      <h2 className="titulo-card" id="titulo-parametros">Parâmetros do sistema</h2>
      <Formulario onSubmit={aoSalvar} noValidate>
        <div className={estilos.campos}>
          <FieldCard id="dias-lote-critico" obrigatorio rotulo="Dias para lote crítico" tipo="numero" valor={diasLoteCritico}
            aoMudar={(valor) => setEstado((atual) => ({ ...atual, diasLoteCritico: valor, erros: {}, erroEnvio: null }))}
            erro={estado.erros.diasLoteCritico} desabilitado={estado.salvando} />
        </div>
        {estado.erroEnvio && <p className={estilos.erro} role="alert">{estado.erroEnvio}</p>}
        <p role="status">{estado.salvando ? 'Salvando parâmetros…' : ''}</p>
        <div className={estilos.acoes}><Button variante="primario" type="submit" disabled={estado.salvando}>{estado.salvando ? 'Salvando…' : 'Salvar alterações'}</Button></div>
      </Formulario>
    </section>}
    <Toast mensagem={toast} />
  </>
}
