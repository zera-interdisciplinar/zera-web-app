

export interface ResultadoVoz {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

export interface ReconhecimentoVoz {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((evento: ResultadoVoz) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export type ConstrutorVoz = new () => ReconhecimentoVoz

export interface JanelaComVoz extends Window {
  SpeechRecognition?: ConstrutorVoz
  webkitSpeechRecognition?: ConstrutorVoz
}
