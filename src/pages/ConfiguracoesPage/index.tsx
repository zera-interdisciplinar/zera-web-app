import estilos from '../../../styles/pages/ConfiguracoesPage/ConfiguracoesPage.module.css'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FieldCard } from '../../components/FieldCard'
import { Formulario } from '../../components/Formulario'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useConfiguracoes } from '../../hooks/useConfiguracoes'

export default function ConfiguracoesPage() {
  const { permissoes, configuracoes, toast, estado, setEstado, diasLoteCritico, aoSalvar } = useConfiguracoes()

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
