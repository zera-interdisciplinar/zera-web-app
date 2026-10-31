import type { NavigationItem } from '../types/app'


export const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', voice: 'dashboard', exact: true },
  { path: '/itens', label: 'Itens', voice: 'itens', exact: false },
  { path: '/modelos', label: 'Modelos', voice: 'modelos', exact: false },
  { path: '/configuracoes', label: 'Configurações', voice: 'configurações', exact: false },
]
