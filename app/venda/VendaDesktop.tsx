'use client'

import Link from 'next/link'
import { Categoria } from '@/lib/supabase/categorias'
import { Produto } from '@/lib/supabase/produtos'
import { Maquininha } from '@/lib/supabase/configuracoes'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

type ItemCarrinhoView = { produto: Produto; quantidade: number }

type Props = {
  // dados
  produtos: Produto[]
  produtosFiltrados: Produto[]
  categorias: Categoria[]
  categoriaId: string | null
  busca: string
  carrinho: Record<string, number>
  itensCarrinho: ItemCarrinhoView[]
  totalItens: number
  totalValor: number
  valorPago: number
  valorRestante: number
  valorACobrar: number
  valorParcial: string
  maquininhas: Maquininha[]
  maquininhaId: string | null
  pixMaquininhaId: string | null
  tipoCartao: 'credito' | 'debito'
  valorRecebido: string
  codigoNaoEncontrado: string | null
  sucesso: boolean
  etapa: string
  mostrarCheckout: boolean
  processando: boolean
  erroCheckout: string | null
  saldoCaixa: string

  // ações
  setBusca: (v: string) => void
  setCategoriaId: (v: string | null) => void
  alterarQuantidade: (produtoId: string, delta: number) => void
  limparCarrinho: () => void
  abrirCheckout: () => void
  fecharCheckoutSemPagar: () => void
  handleEscolherForma: (forma: 'dinheiro' | 'pix_manual' | 'cartao') => void
  setValorParcial: (v: string) => void
  setValorRecebido: (v: string) => void
  setMaquininhaId: (v: string | null) => void
  setPixMaquininhaId: (v: string | null) => void
  setTipoCartao: (v: 'credito' | 'debito') => void
  handleConfirmarDinheiro: () => void
  handleConfirmarPixManual: () => void
  handleConfirmarCartao: () => void
  voltarParaFormas: () => void
}

export default function VendaDesktop(p: Props) {
  const emPagamento = p.mostrarCheckout && p.etapa !== 'escolhendo_forma'

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto', padding: '0 32px 40px' }}>

      {p.sucesso && (
        <div className="success-box" style={{ marginBottom: 18, fontSize: 14 }}>
          ✓ Venda registrada com sucesso!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: 24, alignItems: 'start' }}>

        {/* ————— Coluna da esquerda: produtos ————— */}
        <div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              value={p.busca}
              onChange={(e) => p.setBusca(e.target.value)}
              placeholder="Escaneie o código de barras ou busque pelo nome"
              className="input"
              style={{ fontSize: 14, padding: '13px 16px' }}
            />
          </div>

          {p.codigoNaoEncontrado && (
            <div style={{
              background: 'rgba(255,180,84,0.08)', border: '1px solid rgba(255,180,84,0.28)',
              color: 'var(--amber)', padding: '12px 14px', borderRadius: 10, marginBottom: 14,
              fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span>Código <span className="mono">{p.codigoNaoEncontrado}</span> não está cadastrado.</span>
              <Link
                href={`/produtos/novo?codigo_barras=${encodeURIComponent(p.codigoNaoEncontrado)}`}
                className="btn-secondary"
                style={{ padding: '7px 13px', fontSize: 12.5, whiteSpace: 'nowrap' }}
              >
                Cadastrar agora
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
            <button onClick={() => p.setCategoriaId(null)} className={`pill ${p.categoriaId === null ? 'pill-active' : ''}`}>
              Todas
            </button>
            {p.categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => p.setCategoriaId(c.id)}
                className={`pill ${p.categoriaId === c.id ? 'pill-active' : ''}`}
              >
                {c.nome}
              </button>
            ))}
          </div>

          {p.produtosFiltrados.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 14, padding: '30px 0', textAlign: 'center' }}>
              Nenhum produto encontrado.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 11 }}>
            {p.produtosFiltrados.map((produto) => {
              const qtd = p.carrinho[produto.id] ?? 0
              const noCarrinho = qtd > 0
              return (
                <div
                  key={produto.id}
                  onClick={() => { if (!noCarrinho) p.alterarQuantidade(produto.id, 1) }}
                  className="card"
                  style={{
                    padding: 14,
                    cursor: noCarrinho ? 'default' : 'pointer',
                    borderColor: noCarrinho ? 'var(--line-strong)' : undefined,
                    background: noCarrinho ? 'rgba(79,216,255,0.05)' : undefined,
                    transition: 'border-color .15s, background .15s',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    minHeight: 112,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3 }}>{produto.nome}</div>
                    <div className="mono" style={{ fontSize: 14, color: 'var(--cyan)', marginTop: 5 }}>
                      {reais(produto.preco_venda)}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: produto.estoque_atual <= produto.estoque_minimo ? 'var(--amber)' : 'var(--text-dim)', marginTop: 3 }}>
                      {produto.estoque_atual} un
                    </div>
                  </div>

                  {noCarrinho && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(79,216,255,0.12)', border: '1px solid var(--line-strong)',
                        borderRadius: 999, padding: '4px 7px',
                      }}
                    >
                      <button
                        onClick={() => p.alterarQuantidade(produto.id, -1)}
                        style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--panel-2)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
                      >−</button>
                      <span className="mono" style={{ fontSize: 13.5, color: 'var(--cyan)' }}>{qtd}</span>
                      <button
                        onClick={() => p.alterarQuantidade(produto.id, 1)}
                        style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--panel-2)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
                      >+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ————— Coluna da direita: carrinho fixo ————— */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line-strong)',
            borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 110px)',
          }}>

            {!emPagamento ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                    Carrinho
                  </span>
                  {p.totalItens > 0 && (
                    <button
                      onClick={p.limparCarrinho}
                      style={{ border: 'none', background: 'none', color: 'var(--text-dim)', fontSize: 11.5, cursor: 'pointer', padding: 0 }}
                    >
                      limpar
                    </button>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, marginBottom: 6 }}>
                  {p.itensCarrinho.length === 0 && (
                    <div style={{ padding: '44px 0', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6 }}>
                        Escaneie um produto<br />ou clique nele na lista
                      </p>
                    </div>
                  )}

                  {p.itensCarrinho.map((i) => (
                    <div
                      key={i.produto.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: '1px dashed var(--line)' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {i.produto.nome}
                        </div>
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>
                          {i.quantidade} × {reais(i.produto.preco_venda)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span className="mono" style={{ fontSize: 13 }}>{reais(i.quantidade * i.produto.preco_venda)}</span>
                        <button
                          onClick={() => p.alterarQuantidade(i.produto.id, -i.quantidade)}
                          aria-label={`Remover ${i.produto.nome}`}
                          style={{ border: 'none', background: 'none', color: 'var(--text-dim)', fontSize: 15, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Total</span>
                    <span className="mono" style={{ fontSize: 30, fontWeight: 500, color: 'var(--cyan)', letterSpacing: '-0.02em' }}>
                      {reais(p.totalValor)}
                    </span>
                  </div>

                  {p.valorPago > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 12 }}>
                      <span style={{ color: 'var(--text-dim)' }}>Já pago {reais(p.valorPago)}</span>
                      <span className="mono" style={{ color: 'var(--amber)' }}>Falta {reais(p.valorRestante)}</span>
                    </div>
                  )}

                  {p.mostrarCheckout ? (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Quanto pagar agora</label>
                          {p.valorParcial.trim() !== '' && (
                            <button
                              onClick={() => p.setValorParcial('')}
                              style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                            >
                              tudo
                            </button>
                          )}
                        </div>
                        <input
                          type="number" step="0.01" min="0" max={p.valorRestante}
                          value={p.valorParcial}
                          onChange={(e) => p.setValorParcial(e.target.value)}
                          placeholder={`${reais(p.valorRestante)} (tudo)`}
                          className="input"
                          style={{ padding: '10px 13px', fontSize: 13.5 }}
                        />
                      </div>

                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 8 }}>
                        Forma de pagamento
                      </span>
                      <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                        {([['dinheiro', 'Dinheiro'], ['pix_manual', 'Pix'], ['cartao', 'Cartão']] as const).map(([id, nome]) => (
                          <button
                            key={id}
                            onClick={() => p.handleEscolherForma(id)}
                            className="btn-secondary"
                            style={{ flex: 1, padding: '11px 0', fontSize: 13, justifyContent: 'center' }}
                          >
                            {nome}
                          </button>
                        ))}
                      </div>

                      {p.erroCheckout && <p className="error-text" style={{ marginBottom: 10, fontSize: 12.5 }}>{p.erroCheckout}</p>}

                      <button onClick={p.fecharCheckoutSemPagar} className="btn-secondary" style={{ width: '100%', padding: 10, fontSize: 12.5 }}>
                        {p.valorPago > 0 ? 'Fechar' : 'Cancelar venda'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={p.abrirCheckout}
                        disabled={p.totalItens === 0}
                        className="btn-primary"
                        style={{
                          width: '100%', padding: 15, fontSize: 14.5, justifyContent: 'center',
                          opacity: p.totalItens === 0 ? 0.35 : 1,
                          cursor: p.totalItens === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Finalizar venda
                      </button>
                      {p.totalItens > 0 && (
                        <p className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 9 }}>
                          Enter finaliza · Esc limpa
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              /* ————— Painel de pagamento (mesma coluna, sem modal) ————— */
              <>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>
                  {p.etapa === 'pagamento_dinheiro' && 'Pagamento em dinheiro'}
                  {p.etapa === 'pagamento_pix_manual' && 'Pagamento via Pix'}
                  {p.etapa === 'pagamento_cartao' && 'Pagamento no cartão'}
                </span>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 5 }}>Valor a receber</div>
                  <div className="mono" style={{ fontSize: 34, fontWeight: 500, color: 'var(--cyan)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {reais(p.valorACobrar)}
                  </div>
                </div>

                {p.etapa === 'pagamento_dinheiro' && (
                  <>
                    <label className="label">Valor recebido do cliente</label>
                    <input
                      type="number" step="0.01"
                      value={p.valorRecebido}
                      onChange={(e) => p.setValorRecebido(e.target.value)}
                      placeholder="0,00"
                      className="input"
                      autoFocus
                      style={{ marginBottom: 12, fontSize: 16, padding: '13px 15px' }}
                    />
                    {parseFloat(p.valorRecebido.replace(',', '.') || '0') > p.valorACobrar && (
                      <div style={{
                        background: 'rgba(95,255,176,0.08)', border: '1px solid rgba(95,255,176,0.25)',
                        borderRadius: 10, padding: '11px 14px', marginBottom: 14,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                      }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Troco</span>
                        <span className="mono" style={{ fontSize: 20, color: 'var(--green)' }}>
                          {reais(parseFloat(p.valorRecebido.replace(',', '.') || '0') - p.valorACobrar)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {p.etapa === 'pagamento_pix_manual' && (
                  <>
                    {p.maquininhas.length > 0 && (
                      <>
                        <label className="label">Onde vai receber</label>
                        <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                          <button onClick={() => p.setPixMaquininhaId(null)} className={`pill ${p.pixMaquininhaId === null ? 'pill-active' : ''}`}>
                            Minha chave
                          </button>
                          {p.maquininhas.map((m) => (
                            <button key={m.id} onClick={() => p.setPixMaquininhaId(m.id)} className={`pill ${p.pixMaquininhaId === m.id ? 'pill-active' : ''}`}>
                              {m.nome}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.6 }}>
                      {p.pixMaquininhaId === null
                        ? 'Mostre sua chave Pix pro cliente. Quando o dinheiro cair, confirme abaixo.'
                        : 'Gere a cobrança Pix na maquininha. Quando o cliente pagar, confirme abaixo.'}
                    </p>
                  </>
                )}

                {p.etapa === 'pagamento_cartao' && (
                  <>
                    {p.maquininhas.length > 0 ? (
                      <>
                        <label className="label">Maquininha</label>
                        <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
                          {p.maquininhas.map((m) => (
                            <button key={m.id} onClick={() => p.setMaquininhaId(m.id)} className={`pill ${p.maquininhaId === m.id ? 'pill-active' : ''}`}>
                              {m.nome}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{
                        background: 'rgba(255,180,84,0.08)', border: '1px solid rgba(255,180,84,0.25)',
                        color: 'var(--amber)', padding: '11px 13px', borderRadius: 10, marginBottom: 16,
                        fontSize: 12, lineHeight: 1.5,
                      }}>
                        Nenhuma maquininha cadastrada. A venda funciona, mas o lucro não vai descontar a taxa.
                      </div>
                    )}

                    <label className="label">Tipo</label>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
                      <button onClick={() => p.setTipoCartao('credito')} className={`pill ${p.tipoCartao === 'credito' ? 'pill-active' : ''}`}>Crédito</button>
                      <button onClick={() => p.setTipoCartao('debito')} className={`pill ${p.tipoCartao === 'debito' ? 'pill-active' : ''}`}>Débito</button>
                    </div>
                  </>
                )}

                {p.erroCheckout && <p className="error-text" style={{ marginBottom: 12, fontSize: 12.5 }}>{p.erroCheckout}</p>}

                <div style={{ display: 'flex', gap: 9, marginTop: 'auto' }}>
                  <button onClick={p.voltarParaFormas} className="btn-secondary" style={{ flex: 1, padding: 13, fontSize: 13 }}>
                    Voltar
                  </button>
                  <button
                    onClick={
                      p.etapa === 'pagamento_dinheiro' ? p.handleConfirmarDinheiro
                      : p.etapa === 'pagamento_pix_manual' ? p.handleConfirmarPixManual
                      : p.handleConfirmarCartao
                    }
                    disabled={p.processando}
                    className="btn-primary"
                    style={{ flex: 2, padding: 13, fontSize: 13.5, justifyContent: 'center' }}
                  >
                    {p.processando ? 'Registrando...'
                      : p.etapa === 'pagamento_dinheiro' ? 'Confirmar recebimento'
                      : p.etapa === 'pagamento_pix_manual' ? 'Confirmar recebido'
                      : 'Confirmar aprovado'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
