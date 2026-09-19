'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listarCategorias, Categoria } from '@/lib/supabase/categorias'
import { listarProdutos, buscarProdutoPorCodigoBarras, Produto } from '@/lib/supabase/produtos'
import {
  criarVenda,
  adicionarPagamentoConfirmado,
  adicionarPagamentoPendente,
  confirmarPagamentoPendente,
  cancelarVendaNaoPaga,
  ItemCarrinho,
} from '@/lib/supabase/vendas'
import { buscarCaixaAberto, CaixaSessao } from '@/lib/supabase/caixa'
import { Maquininha, listarMaquininhas } from '@/lib/supabase/configuracoes'
import { useLeitorCodigoBarras } from '@/lib/useLeitorCodigoBarras'

const FORMAS_PAGAMENTO: { id: 'dinheiro' | 'pix_manual' | 'cartao'; nome: string }[] = [
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'pix_manual', nome: 'Pix' },
  { id: 'cartao', nome: 'Cartão' },
]

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

type EtapaCheckout =
  | 'escolhendo_forma'
  | 'pagamento_dinheiro'
  | 'pagamento_pix_manual'
  | 'pagamento_cartao'

export default function VendaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [caixa, setCaixa] = useState<CaixaSessao | null | undefined>(undefined) // undefined = ainda carregando

  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [vendaId, setVendaId] = useState<string | null>(null)
  const [valorPago, setValorPago] = useState(0)
  const [etapa, setEtapa] = useState<EtapaCheckout>('escolhendo_forma')
  const [processando, setProcessando] = useState(false)
  const [erroCheckout, setErroCheckout] = useState<string | null>(null)

  // código de barras não encontrado
  const [codigoNaoEncontrado, setCodigoNaoEncontrado] = useState<string | null>(null)

  // pagamento em dinheiro
  const [valorRecebido, setValorRecebido] = useState('')

  // quanto dessa venda vai ser pago na forma escolhida agora (pagamento misto).
  // Vazio = o valor restante inteiro.
  const [valorParcial, setValorParcial] = useState('')

  // pagamento no cartão
  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([])
  const [maquininhaId, setMaquininhaId] = useState<string | null>(null)
  const [tipoCartao, setTipoCartao] = useState<'credito' | 'debito'>('credito')

  async function carregarDados() {
    setCarregando(true)
    try {
      const [p, c, sessao, maqs] = await Promise.all([
        listarProdutos(), listarCategorias(), buscarCaixaAberto(), listarMaquininhas(true),
      ])
      setProdutos(p)
      setCategorias(c)
      setCaixa(sessao)
      setMaquininhas(maqs)
    } catch (e) {
      setErro('Não foi possível carregar os produtos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarDados() }, [])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const bateCategoria = !categoriaId || p.categoria_id === categoriaId
      const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
      return bateCategoria && bateBusca
    })
  }, [produtos, categoriaId, busca])

  const itensCarrinho = useMemo(() => {
    return Object.entries(carrinho)
      .filter(([, qtd]) => qtd > 0)
      .map(([produtoId, qtd]) => ({ produto: produtos.find((p) => p.id === produtoId)!, quantidade: qtd }))
  }, [carrinho, produtos])

  const totalItens = itensCarrinho.reduce((soma, i) => soma + i.quantidade, 0)
  const totalValor = itensCarrinho.reduce((soma, i) => soma + i.quantidade * i.produto.preco_venda, 0)
  const valorRestante = Math.max(0, Math.round((totalValor - valorPago) * 100) / 100)

  // Valor a cobrar na forma escolhida agora: o que o usuário digitou como
  // parcial, ou o restante inteiro se ele não digitou nada.
  const valorParcialNum = parseFloat(valorParcial.replace(',', '.') || '0')
  const valorACobrar = valorParcial.trim() !== '' && valorParcialNum > 0
    ? Math.round(Math.min(valorParcialNum, valorRestante) * 100) / 100
    : valorRestante

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((prev) => {
      const atual = prev[produtoId] ?? 0
      return { ...prev, [produtoId]: Math.max(0, atual + delta) }
    })
  }

  // Leitor de código de barras: ativo na tela de montar o carrinho (não durante o checkout)
  useLeitorCodigoBarras(async (codigo) => {
    if (mostrarCheckout) return
    setCodigoNaoEncontrado(null)
    const jaCadastrado = produtos.find((p) => p.codigo_barras === codigo)
    if (jaCadastrado) {
      alterarQuantidade(jaCadastrado.id, 1)
      return
    }
    try {
      const encontrado = await buscarProdutoPorCodigoBarras(codigo)
      if (encontrado) {
        setProdutos((prev) => [...prev, encontrado])
        alterarQuantidade(encontrado.id, 1)
      } else {
        setCodigoNaoEncontrado(codigo)
      }
    } catch (e) {
      setCodigoNaoEncontrado(codigo)
    }
  }, !mostrarCheckout && !carregando)

  async function abrirCheckout() {
    if (!caixa) {
      setErro('Abra o caixa antes de vender.')
      return
    }
    setErroCheckout(null)
    setVendaId(null)
    setValorPago(0)
    setEtapa('escolhendo_forma')
    setMostrarCheckout(true)

    try {
      const itens: ItemCarrinho[] = itensCarrinho.map((i) => ({
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_venda_unitario: i.produto.preco_venda,
        preco_custo_unitario: i.produto.preco_custo,
      }))
      const id = await criarVenda(itens, caixa.id)
      setVendaId(id)
    } catch (e: any) {
      setErroCheckout(e?.message ?? 'Não foi possível iniciar a venda.')
    }
  }

  async function fecharCheckoutSemPagar() {
    // Se a venda foi criada mas nenhum pagamento entrou, ela é descartada —
    // senão ficaria pendurada como "aguardando pagamento" pra sempre.
    if (vendaId && valorPago === 0) {
      try {
        await cancelarVendaNaoPaga(vendaId)
      } catch (e) {
        // se falhar, não trava o caixa — a venda aparece como aguardando no histórico
      }
    }
    setMostrarCheckout(false)
    setVendaId(null)
    setEtapa('escolhendo_forma')
    setErroCheckout(null)
    setValorParcial('')
  }

  function handleEscolherForma(forma: 'dinheiro' | 'pix_manual' | 'cartao') {
    setErroCheckout(null)
    if (forma === 'dinheiro') {
      setValorRecebido('')
      setEtapa('pagamento_dinheiro')
    } else if (forma === 'pix_manual') {
      setEtapa('pagamento_pix_manual')
    } else if (forma === 'cartao') {
      setTipoCartao('credito')
      setMaquininhaId(maquininhas.length > 0 ? maquininhas[0].id : null)
      setEtapa('pagamento_cartao')
    }
  }

  async function aposPagamentoConfirmado(valorDessePagamento: number) {
    const novoValorPago = valorPago + valorDessePagamento
    setValorPago(novoValorPago)

    if (novoValorPago + 0.001 >= totalValor) {
      // venda concluída
      setSucesso(true)
      setMostrarCheckout(false)
      setCarrinho({})
      setVendaId(null)
      setValorParcial('')
      await carregarDados()
      setTimeout(() => setSucesso(false), 2500)
    } else {
      // pagamento misto: falta cobrir o restante
      setValorParcial('')
      setEtapa('escolhendo_forma')
    }
  }

  async function handleConfirmarDinheiro() {
    if (!vendaId) return
    const recebido = parseFloat(valorRecebido.replace(',', '.') || '0')
    if (recebido < valorACobrar) {
      setErroCheckout('O valor recebido é menor que o valor a receber.')
      return
    }
    setProcessando(true)
    setErroCheckout(null)
    try {
      await adicionarPagamentoConfirmado({
        venda_id: vendaId,
        forma: 'dinheiro',
        valor: valorACobrar,
        valor_recebido: recebido,
        troco: Math.round((recebido - valorACobrar) * 100) / 100,
      })
      await aposPagamentoConfirmado(valorACobrar)
    } catch (e: any) {
      setErroCheckout(e?.message ?? 'Não foi possível registrar o pagamento.')
    } finally {
      setProcessando(false)
    }
  }

  async function handleConfirmarPixManual() {
    if (!vendaId) return
    setProcessando(true)
    setErroCheckout(null)
    try {
      const pagamentoId = await adicionarPagamentoPendente({ venda_id: vendaId, forma: 'pix_manual', valor: valorACobrar })
      await confirmarPagamentoPendente(pagamentoId)
      await aposPagamentoConfirmado(valorACobrar)
    } catch (e: any) {
      setErroCheckout(e?.message ?? 'Não foi possível confirmar o Pix.')
    } finally {
      setProcessando(false)
    }
  }

  async function handleConfirmarCartao() {
    if (!vendaId) return
    if (maquininhas.length > 0 && !maquininhaId) {
      setErroCheckout('Escolha em qual maquininha foi passado.')
      return
    }
    setProcessando(true)
    setErroCheckout(null)
    try {
      await adicionarPagamentoConfirmado({
        venda_id: vendaId,
        forma: 'cartao',
        valor: valorACobrar,
        tipo_cartao: tipoCartao,
        maquininha_id: maquininhaId,
      })
      await aposPagamentoConfirmado(valorACobrar)
    } catch (e: any) {
      setErroCheckout(e?.message ?? 'Não foi possível registrar o pagamento.')
    } finally {
      setProcessando(false)
    }
  }


  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>

  if (!caixa) {
    return (
      <div className="container" style={{ maxWidth: 420 }}>
        <Link href="/" className="back-link">← Voltar</Link>
        <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Venda</h1>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ marginBottom: 14 }}>Ainda não tem um caixa aberto hoje.</p>
          <Link href="/caixa" className="btn-primary" style={{ width: '100%' }}>Abrir caixa</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Venda</h1>

      {sucesso && <div className="success-box" style={{ marginBottom: 14 }}>✓ Venda registrada com sucesso!</div>}

      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto (ou escaneie o código de barras)" className="input" style={{ marginBottom: 12 }} />

      {codigoNaoEncontrado && (
        <div style={{ background: 'rgba(255,180,84,0.1)', border: '1px solid rgba(255,180,84,0.3)', color: 'var(--amber)', padding: 10, borderRadius: 10, marginBottom: 12, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>Código {codigoNaoEncontrado} não cadastrado.</span>
          <Link href={`/produtos/novo?codigo_barras=${encodeURIComponent(codigoNaoEncontrado)}`} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>
            Cadastrar agora
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        <button onClick={() => setCategoriaId(null)} className={`pill ${categoriaId === null ? 'pill-active' : ''}`}>Todas</button>
        {categorias.map((c) => (
          <button key={c.id} onClick={() => setCategoriaId(c.id)} className={`pill ${categoriaId === c.id ? 'pill-active' : ''}`}>{c.nome}</button>
        ))}
      </div>

      {produtosFiltrados.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhum produto encontrado.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {produtosFiltrados.map((p) => {
          const qtd = carrinho[p.id] ?? 0
          return (
            <div key={p.id} className="card">
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nome}</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 2 }}>{reais(p.preco_venda)}</div>

              {qtd === 0 ? (
                <button onClick={() => alterarQuantidade(p.id, 1)} className="btn-secondary" style={{ marginTop: 8, width: '100%', padding: 8, fontSize: 13 }}>
                  Adicionar
                </button>
              ) : (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(79,216,255,0.1)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: '4px 8px' }}>
                  <button onClick={() => alterarQuantidade(p.id, -1)} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'var(--panel-2)', color: 'var(--cyan)' }}>−</button>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--cyan)' }}>{qtd}</span>
                  <button onClick={() => alterarQuantidade(p.id, 1)} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'var(--panel-2)', color: 'var(--cyan)' }}>+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalItens > 0 && !mostrarCheckout && (
        <div
          onClick={abrirCheckout}
          className="btn-primary"
          style={{ position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 440, margin: '0 auto', justifyContent: 'space-between', padding: '14px 18px', boxShadow: '0 0 24px -6px rgba(79,216,255,0.5)' }}
        >
          <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
          <span className="mono">{reais(totalValor)} · Ver carrinho</span>
        </div>
      )}

      {mostrarCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>

            {etapa === 'escolhendo_forma' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Finalizar venda</h2>

                {itensCarrinho.map((i) => (
                  <div key={i.produto.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                    <span>{i.quantidade}x {i.produto.nome}</span>
                    <span className="mono">{reais(i.quantidade * i.produto.preco_venda)}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 500, padding: '12px 0' }}>
                  <span>Total</span>
                  <span className="mono" style={{ color: 'var(--cyan)' }}>{reais(totalValor)}</span>
                </div>

                {valorPago > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0 12px', color: 'var(--text-dim)' }}>
                    <span>Já pago: {reais(valorPago)}</span>
                    <span className="mono" style={{ color: 'var(--amber)' }}>Falta {reais(valorRestante)}</span>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13 }}>Quanto pagar agora</label>
                    {valorParcial.trim() !== '' && (
                      <button
                        onClick={() => setValorParcial('')}
                        style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                      >
                        usar o valor todo
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={valorRestante}
                    value={valorParcial}
                    onChange={(e) => setValorParcial(e.target.value)}
                    placeholder={`${reais(valorRestante)} (tudo)`}
                    className="input"
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>
                    Deixe vazio pra cobrar tudo numa forma só. Preencha só se o cliente for dividir entre duas formas.
                  </p>
                </div>

                <p style={{ fontSize: 13, marginBottom: 8 }}>Forma de pagamento</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <button key={f.id} onClick={() => handleEscolherForma(f.id)} className="pill">
                      {f.nome}
                    </button>
                  ))}
                </div>

                {erroCheckout && <p className="error-text" style={{ marginBottom: 10 }}>{erroCheckout}</p>}

                <button onClick={fecharCheckoutSemPagar} className="btn-secondary" style={{ width: '100%', padding: 12 }}>
                  {valorPago > 0 ? 'Fechar (mantém pagamentos já feitos)' : 'Voltar'}
                </button>
              </>
            )}

            {etapa === 'pagamento_dinheiro' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Pagamento em dinheiro</h2>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Valor a receber</p>
                <p className="mono" style={{ fontSize: 22, color: 'var(--cyan)', marginBottom: 16 }}>{reais(valorACobrar)}</p>

                <label className="label">Valor recebido do cliente</label>
                <input type="number" step="0.01" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} placeholder="0,00" className="input" style={{ marginBottom: 10 }} />

                {parseFloat(valorRecebido.replace(',', '.') || '0') > valorACobrar && (
                  <p style={{ fontSize: 13, marginBottom: 10 }}>
                    Troco: <span className="mono" style={{ color: 'var(--green)' }}>{reais(parseFloat(valorRecebido.replace(',', '.') || '0') - valorACobrar)}</span>
                  </p>
                )}

                {erroCheckout && <p className="error-text" style={{ marginBottom: 10 }}>{erroCheckout}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEtapa('escolhendo_forma')} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
                  <button onClick={handleConfirmarDinheiro} disabled={processando} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                    {processando ? 'Registrando...' : 'Confirmar recebimento'}
                  </button>
                </div>
              </>
            )}

            {etapa === 'pagamento_pix_manual' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Pix (sua chave)</h2>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Valor a receber</p>
                <p className="mono" style={{ fontSize: 22, color: 'var(--cyan)', marginBottom: 16 }}>{reais(valorACobrar)}</p>
                <p style={{ fontSize: 13, marginBottom: 16 }}>Mostre sua chave Pix (ou o QR do seu app) pro cliente. Quando o dinheiro cair na sua conta, confirme abaixo.</p>

                {erroCheckout && <p className="error-text" style={{ marginBottom: 10 }}>{erroCheckout}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEtapa('escolhendo_forma')} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
                  <button onClick={handleConfirmarPixManual} disabled={processando} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                    {processando ? 'Confirmando...' : 'Confirmar recebido'}
                  </button>
                </div>
              </>
            )}

            {etapa === 'pagamento_cartao' && (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Cartão</h2>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>Valor a cobrar</p>
                <p className="mono" style={{ fontSize: 22, color: 'var(--cyan)', marginBottom: 16 }}>{reais(valorACobrar)}</p>
                <p style={{ fontSize: 13, marginBottom: 16 }}>Faça a cobrança na maquininha. Depois, registre aqui como foi pago.</p>

                {maquininhas.length > 0 && (
                  <>
                    <label className="label">Maquininha</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      {maquininhas.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMaquininhaId(m.id)}
                          className={`pill ${maquininhaId === m.id ? 'pill-active' : ''}`}
                        >
                          {m.nome}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {maquininhas.length === 0 && (
                  <div style={{ background: 'rgba(255,180,84,0.1)', border: '1px solid rgba(255,180,84,0.3)', color: 'var(--amber)', padding: 10, borderRadius: 10, marginBottom: 16, fontSize: 12.5, lineHeight: 1.5 }}>
                    Nenhuma maquininha cadastrada. A venda funciona normalmente, mas o lucro não vai
                    descontar a taxa. Cadastre em Configurações.
                  </div>
                )}

                <label className="label">Tipo</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setTipoCartao('credito')} className={`pill ${tipoCartao === 'credito' ? 'pill-active' : ''}`}>Crédito</button>
                  <button onClick={() => setTipoCartao('debito')} className={`pill ${tipoCartao === 'debito' ? 'pill-active' : ''}`}>Débito</button>
                </div>

                {erroCheckout && <p className="error-text" style={{ marginBottom: 10 }}>{erroCheckout}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setEtapa('escolhendo_forma')} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
                  <button onClick={handleConfirmarCartao} disabled={processando} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                    {processando ? 'Registrando...' : 'Confirmar aprovado'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
