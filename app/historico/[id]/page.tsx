'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { buscarVenda, cancelarVenda, VendaDetalhe, FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function DetalheVendaPage() {
  const params = useParams()
  const id = params.id as string

  const [venda, setVenda] = useState<VendaDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)

  function carregar() {
    setCarregando(true)
    buscarVenda(id).then(setVenda).catch(() => setErro('Não foi possível carregar essa venda.')).finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [id])

  async function handleCancelar() {
    const confirmar = window.confirm('Tem certeza que quer cancelar essa venda? Os produtos voltam pro estoque.')
    if (!confirmar) return

    setCancelando(true)
    setErro(null)
    try {
      await cancelarVenda(id)
      carregar()
    } catch (e) {
      setErro('Não foi possível cancelar essa venda. Tente novamente.')
    } finally {
      setCancelando(false)
    }
  }

  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  if (erro && !venda) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60 }} className="error-text">{erro}</p>
  if (!venda) return null

  const data = new Date(venda.data_hora)
  const cancelada = venda.status === 'cancelada'

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <Link href="/historico" className="back-link">← Voltar</Link>

      <h1 style={{ fontSize: 18, fontWeight: 500 }}>
        Venda de {data.toLocaleDateString('pt-BR')} às {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </h1>

      {cancelada && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff9d9d', padding: 10, borderRadius: 10, marginTop: 12, fontSize: 13 }}>
          Essa venda foi cancelada. O estoque já foi devolvido.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {venda.itens.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--line)', fontSize: 14 }}>
            <span>{item.quantidade}x {item.produtos?.nome ?? 'Produto removido'}</span>
            <span className="mono">{reais(item.quantidade * item.preco_venda_unitario)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 16, fontWeight: 500 }}>
        <span>Total</span>
        <span className="mono" style={{ color: 'var(--cyan)' }}>{reais(venda.valor_total)}</span>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 20 }}>
        <span style={{ color: 'var(--text-dim)' }}>Forma de pagamento</span>
        <span>{FORMA_PAGAMENTO_LABEL[venda.forma_pagamento] ?? venda.forma_pagamento}</span>
      </div>

      {erro && <p className="error-text" style={{ marginBottom: 10 }}>{erro}</p>}

      {!cancelada && (
        <button onClick={handleCancelar} disabled={cancelando} className="btn-danger" style={{ width: '100%' }}>
          {cancelando ? 'Cancelando...' : 'Cancelar venda'}
        </button>
      )}
      {!cancelada && (
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
          Os produtos voltam pro estoque automaticamente. A venda continua aqui, marcada como cancelada.
        </p>
      )}
    </div>
  )
}
