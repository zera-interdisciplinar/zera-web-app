import { Formulario } from '../Formulario'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Modal } from '../Modal'
import { EstadoErro } from '../EstadoErro'
import type { RetornoCadastroModelo } from '../../types/formularioModelo'
import type { Categoria } from '../../types/categoria'
import type { EstadoRequisicao } from '../../hooks/useRequisicao'
import estilos from '../../../styles/pages/ModelosPage/ModelosPage.module.css'

export function CadastroModelo({ cadastro, categorias }: { cadastro: RetornoCadastroModelo; categorias: EstadoRequisicao<Categoria[]> }) {
  const { materiais, modoDemonstracao, modalAberto, form, erros, enviando, erroEnvio, fechar, alterar, alternarMaterial, aoSalvar } = cadastro
  return (
      <Modal aberto={modalAberto} titulo="Adicionar modelo" aoFechar={fechar}>
        <Formulario onSubmit={aoSalvar} noValidate>
          <div className={estilos.camposModal}>
            <FieldCard
              id="modelo-nome" obrigatorio
              rotulo="Modelo"
              valor={form.nome}
              aoMudar={(valor) => alterar('nome', valor)}
              erro={erros.nome ?? erros.name}
              placeholder="Ex: Inspiron 15 3000"
              maxLength={modoDemonstracao ? 80 : 120}
              desabilitado={enviando}
            />
            <FieldCard
              id="modelo-fabricante" obrigatorio
              rotulo="Fabricante"
              valor={form.fabricante}
              aoMudar={(valor) => alterar('fabricante', valor)}
              erro={erros.fabricante ?? erros.manufacturer}
              placeholder="Ex: Dell"
              maxLength={modoDemonstracao ? 60 : 120}
              desabilitado={enviando}
            />
            <FieldCard
              id="modelo-categoria" obrigatorio
              rotulo="Categoria"
              tipo="select"
              valor={form.categoriaId}
              aoMudar={(valor) => alterar('categoriaId', valor)}
              erro={erros.categoriaId ?? erros.categoryId}
              desabilitado={enviando}
              opcoes={[
                { valor: '', rotulo: 'Selecione uma categoria' },
                ...(categorias.dados ?? []).map((categoria) => ({
                  valor: String(categoria.id),
                  rotulo: categoria.nome,
                })),
              ]}
            />
            <FieldCard
              id="modelo-vida-util"
              rotulo={modoDemonstracao ? "Vida útil (meses)" : "Vida útil estimada (meses, opcional)"}
              tipo="numero"
              valor={form.vidaUtilMeses}
              aoMudar={(valor) => alterar('vidaUtilMeses', valor)}
              erro={erros.vidaUtilMeses ?? erros.expectedLifespanMonths}
              placeholder="Ex: 60"
              desabilitado={enviando}
            />
            {modoDemonstracao ? <FieldCard
              id="modelo-especificacoes" rotulo="Especificações" tipo="textarea"
              valor={form.especificacoes} aoMudar={(valor) => alterar('especificacoes', valor)}
              placeholder={'Uma por linha, no formato Chave: valor\nEx: Memória: 8 GB DDR4'}
              desabilitado={enviando} maxLength={2000}
            /> : <>
              <fieldset id="modelo-materiais" tabIndex={-1} className={estilos.materiais} disabled={enviando}
                aria-invalid={Boolean(erros.materials)}
                aria-describedby={erros.materials ? 'modelo-materiais-erro' : 'modelo-materiais-ajuda'}>
                <legend>Materiais</legend>
                <p id="modelo-materiais-ajuda">Selecione os materiais que compõem o modelo.</p>
                {materiais.carregando && <p role="status">Carregando materiais…</p>}
                {materiais.erro && <EstadoErro mensagem={materiais.erro} aoTentarNovamente={materiais.recarregar} />}
                <div className={estilos.listaMateriais}>
                  {(materiais.dados ?? []).map((material) => <label key={material.id} htmlFor={`material-modelo-${material.id}`}>
                    <input id={`material-modelo-${material.id}`} type="checkbox" checked={form.materiais.includes(material.code)}
                      onChange={() => alternarMaterial(material.code)} />
                    {material.name}
                  </label>)}
                </div>
                {materiais.dados?.length === 0 && <p>Nenhum material disponível para seleção.</p>}
                {erros.materials && <p id="modelo-materiais-erro" role="alert">{erros.materials}</p>}
                {form.materiais.includes('OTHER') && <FieldCard id="modelo-outro-material" obrigatorio rotulo="Qual outro material?" valor={form.outroMaterial} aoMudar={(valor) => alterar('outroMaterial', valor)} maxLength={120} erro={erros.outroMaterial} />}
                {form.materiais.includes('OTHER') && <p>A descrição será incluída nas observações do modelo.</p>}
              </fieldset>
              <FieldCard id="modelo-garantia" rotulo="Garantia (meses, opcional)" tipo="numero" valor={form.garantiaMeses}
                aoMudar={(valor) => alterar('garantiaMeses', valor)} erro={erros.warrantyMonths} desabilitado={enviando} />
              <FieldCard id="modelo-peso" rotulo="Peso estimado (kg, opcional)" tipo="numero" valor={form.pesoEstimadoKg}
                aoMudar={(valor) => alterar('pesoEstimadoKg', valor)} erro={erros.estimatedWeightKg} desabilitado={enviando} />
              <FieldCard id="modelo-observacoes" rotulo="Observações (opcional)" tipo="textarea" valor={form.observacoes}
                aoMudar={(valor) => alterar('observacoes', valor)} erro={erros.notes} maxLength={500} desabilitado={enviando} />
            </>}
          </div>

          {erroEnvio && (
            <p className={estilos.erroModal} role="alert">
              {erroEnvio}
            </p>
          )}

          <p role="status">{enviando ? 'Salvando modelo…' : ''}</p>
          <div className={estilos.acoesModal}>
            <Button variante="primario" tamanho="grande" type="submit" disabled={enviando}>
              {enviando ? 'Salvando…' : 'Concluir cadastro'}
            </Button>
            <Button
              variante="secundario"
              tamanho="grande"
              onClick={fechar}
              disabled={enviando}
            >
              Cancelar
            </Button>
          </div>
        </Formulario>
      </Modal>

  )
}
