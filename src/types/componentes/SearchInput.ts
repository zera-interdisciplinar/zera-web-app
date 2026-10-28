

export interface SearchInputProps {
  id: string
  valor: string
  aoMudar: (valor: string) => void
  rotulo: string
  placeholder?: string
  aoEnviar?: () => void
}
