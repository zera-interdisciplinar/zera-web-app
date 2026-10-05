import type { NovoDescarte, BuscaLocaisReciclagem } from '../types/descarte'
import type { ResultadoValidacao, ErrosDeCampo } from './validacao'
import { sanitizarTexto } from './sanitizacao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarNovoDescarte(entrada: NovoDescarte, hoje = new Date()): ResultadoValidacao<NovoDescarte> {
  const dados: NovoDescarte = {
    destination: entrada.destination,
    itemIds: [...new Set(entrada.itemIds)],
    ...(entrada.placeId?.trim() ? { placeId: sanitizarTexto(entrada.placeId) } : {}),
    ...(entrada.placeName?.trim() ? { placeName: sanitizarTexto(entrada.placeName) } : {}),
    ...(entrada.notes?.trim() ? { notes: sanitizarTexto(entrada.notes) } : {}),
    ...(entrada.disposedAt?.trim() ? { disposedAt: entrada.disposedAt.trim() } : {}),
  }
  const erros: ErrosDeCampo<NovoDescarte> = {}
  if (!['RECYCLING', 'LANDFILL', 'DONATION'].includes(dados.destination)) erros.destination = 'Selecione o destino.'
  if (!dados.itemIds.length || dados.itemIds.some((id) => !UUID.test(id))) erros.itemIds = 'Selecione ao menos um item válido.'
  if ((dados.placeId?.length ?? 0) > 200) erros.placeId = 'O identificador do local pode ter até 200 caracteres.'
  if ((dados.placeName?.length ?? 0) > 200) erros.placeName = 'O nome do local pode ter até 200 caracteres.'
  if ((dados.notes?.length ?? 0) > 500) erros.notes = 'As observações podem ter até 500 caracteres.'
  if (dados.disposedAt) {
    const data = new Date(`${dados.disposedAt}T00:00:00Z`)
    const limite = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.disposedAt) || !Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== dados.disposedAt) erros.disposedAt = 'Informe uma data válida.'
    else if (dados.disposedAt > limite) erros.disposedAt = 'Informe a data em que o descarte ocorreu. Ela não pode estar no futuro.'
  }
  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarBuscaLocais(entrada: BuscaLocaisReciclagem): ResultadoValidacao<BuscaLocaisReciclagem> {
  const dados = { ...entrada }
  const erros: ErrosDeCampo<BuscaLocaisReciclagem> = {}
  if (!Number.isFinite(dados.lat) || dados.lat < -90 || dados.lat > 90) erros.lat = 'Informe uma latitude válida.'
  if (!Number.isFinite(dados.lng) || dados.lng < -180 || dados.lng > 180) erros.lng = 'Informe uma longitude válida.'
  if (dados.radiusMeters !== undefined && (!Number.isInteger(dados.radiusMeters) || dados.radiusMeters <= 0)) erros.radiusMeters = 'Informe um raio de busca positivo em metros.'
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
