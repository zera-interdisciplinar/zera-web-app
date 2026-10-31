import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Tabs } from '../../components/Tabs'
import { CategoriesTab } from '../../components/CategoriesTab'
import { ModelsTab } from '../../components/ModelsTab'
import styles from '../../../styles/components/Models/Models.module.css'

const TABS = [{ id: 'modelos', rotulo: 'Modelos' }, { id: 'categorias', rotulo: 'Categorias' }]

export default function ModelsPage() {
  const [params, setParams] = useSearchParams()
  const active = params.get('tab') === 'categorias' ? 'categorias' : 'modelos'
  const title = active === 'modelos' ? 'Todos os modelos' : 'Todas as categorias'

  return (
    <div className={styles.page}>
      <PageHeader titulo="Modelos" subtitulo="Especificações técnicas que os itens herdam no cadastro, e as categorias que os agrupam." />
      <Tabs abas={TABS} ativa={active} rotuloLista="Modelos e categorias" aoSelecionar={(id) => setParams(id === 'categorias' ? { tab: 'categorias' } : {}, { replace: true })} />
      <section id={`painel-${active}`} role="tabpanel" aria-labelledby={`aba-${active}`} className={styles.card}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {active === 'modelos' ? <ModelsTab /> : <CategoriesTab />}
      </section>
    </div>
  )
}
