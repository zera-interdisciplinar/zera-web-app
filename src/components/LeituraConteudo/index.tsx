import { useLeituraConteudo } from '../../hooks/useLeituraConteudo'

export function LeituraConteudo() {
  const { lendo, mensagem, suportado, alternarLeitura } = useLeituraConteudo()
  return <>
    <button type="button" onClick={alternarLeitura} disabled={!suportado} aria-pressed={lendo}>
      {lendo ? 'Parar leitura' : 'Ler conteúdo em voz alta'}
    </button>
    <p>Leitura opcional com voz local em português, sem microfone. Campos de formulário não são lidos. Para navegar por controles e tabelas, use o leitor de tela do sistema, como NVDA.</p>
    {!suportado && <p>Leitura em voz alta não disponível neste navegador.</p>}
    <p role="status" aria-atomic="true">{mensagem}</p>
  </>
}
