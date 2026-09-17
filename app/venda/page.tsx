'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { listarCategorias, Categoria } from '@/lib/supabase/categorias'
import { listarProdutos, Produto } from '@/lib/supabase/produtos'
import { finalizarVenda } from '@/lib/supabase/vendas'

const FORMAS_PAGAMENTO = [
  { id: 'pix', nome: 'Pix' },
  { id: 'debito', nome: 'Débito' },
  { id: 'credito', nome: 'Crédito' },
  { id: 'dinheiro', nome: 'Dinheiro' },
]

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function VendaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [carrinho, setCarrinho] = useState<Record<string, number>>({})
  const [carregando, setCarregando] = useState(true)
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function carregarDados() {
    setCarregando(true)
    try {
      const [p, c] = await Promise.all([listarProdutos(), listarCategorias()])
      setProdutos(p)
      setCategorias(c)
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

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((prev) => {
      const atual = prev[produtoId] ?? 0
      return { ...prev, [produtoId]: Math.max(0, atual + delta) }
    })
  }

  async function handleFinalizar() {
    if (!formaPagamento) return setErro('Escolha a forma de pagamento.')
    setFinalizando(true)
    setErro(null)
    try {
      const itens = itensCarrinho.map((i) => ({
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_venda_unitario: i.produto.preco_venda,
        preco_custo_unitario: i.produto.preco_custo,
      }))
      await finalizarVenda(itens, formaPagamento)
      setSucesso(true)
      setCarrinho({})
      setMostrarCheckout(false)
      setFormaPagamento(null)
      await carregarDados()
      setTimeout(() => setSucesso(false), 2500)
    } catch (e) {
      setErro('Não foi possível finalizar a venda. Tente novamente.')
    } finally {
      setFinalizando(false)
    }
  }

  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Venda</h1>

      {sucesso && <div className="success-box" style={{ marginBottom: 14 }}>✓ Venda registrada com sucesso!</div>}

      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" className="input" style={{ marginBottom: 12 }} />

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
          onClick={() => setMostrarCheckout(true)}
          className="btn-primary"
          style={{ position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 440, margin: '0 auto', justifyContent: 'space-between', padding: '14px 18px', boxShadow: '0 0 24px -6px rgba(79,216,255,0.5)' }}
        >
          <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
          <span className="mono">{reais(totalValor)} · Ver carrinho</span>
        </div>
      )}

      {mostrarCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', padding: 20 }}>
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

            <p style={{ fontSize: 13, marginBottom: 8 }}>Forma de pagamento</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {FORMAS_PAGAMENTO.map((f) => (
                <button key={f.id} onClick={() => setFormaPagamento(f.id)} className={`pill ${formaPagamento === f.id ? 'pill-active' : ''}`}>
                  {f.nome}
                </button>
              ))}
            </div>

            {erro && <p className="error-text" style={{ marginBottom: 10 }}>{erro}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setMostrarCheckout(false); setErro(null) }} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
              <button onClick={handleFinalizar} disabled={finalizando} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                {finalizando ? 'Registrando...' : 'Confirmar venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
