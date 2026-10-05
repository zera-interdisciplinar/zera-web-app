import type { DataTableProps } from '../../types/componentes/DataTable'
export type { Coluna, DataTableProps } from '../../types/componentes/DataTable'

import estilos from '../../../styles/components/DataTable/DataTable.module.css'

export function DataTable<T>({ colunas, dados, chave, legenda }: DataTableProps<T>) {
  return (
    <div className={estilos.rolagem} role="region" aria-label={legenda} tabIndex={0}>
    <table className={estilos.tabela}>
      <caption className="somente-leitor-de-tela">{legenda}</caption>
      <thead>
        <tr>
          {colunas.map((coluna) => (
            <th
              key={coluna.titulo}
              scope="col"
              className={coluna.numerica ? estilos.numerica : undefined}
            >
              {coluna.titulo}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dados.map((item) => (
          <tr key={chave(item)}>
            {colunas.map((coluna) => (
              <td
                key={coluna.titulo}
                className={coluna.numerica ? estilos.numerica : undefined}
              >
                {coluna.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
