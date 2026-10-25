/** The sections of the manager panel, shared by the sidebar and the voice commands. */
export interface NavigationItem {
  path: string
  label: string
  /** What the person says after "ir para". */
  voice: string
  exact: boolean
}

export const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', voice: 'dashboard', exact: true },
  { path: '/itens', label: 'Itens', voice: 'itens', exact: false },
  { path: '/modelos', label: 'Modelos', voice: 'modelos', exact: false },
]
