

export interface DefinicaoAba {
  id: string
  rotulo: string
}

export interface TabsProps {
  abas: DefinicaoAba[]
  ativa: string
  aoSelecionar: (id: string) => void
  rotuloLista: string
}
