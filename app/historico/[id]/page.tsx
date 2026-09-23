'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { buscarVenda, cancelarVenda, VendaDetalhe, FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../../NavDesktop'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function DetalheVendaPage() {
  const isDesktop = useIsDesktop()
  const params = useParams()
  const id = params.id as string

  const [venda, setVenda] = useState<VendaDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [retornaEstoque, setRetornaEstoque] = useState(true)

  function carregar() {
    setCarregando(true)
    buscarVenda(id).then(setVenda).catch(() => setErro('Não foi possível carregar essa venda.')).finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [id])

  async function handleCancelar() {
    if (!motivo.trim()) {
      setErro('Diga o motivo do cancelamento.')
      return
    }
    setCancelando(true)
    setErro(null)
    try {
      await cancelarVenda(id, motivo.trim(), retornaEstoque)
      setMostrarMotivo(false)
      setMotivo('')
      carregar()
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível cancelar essa venda. Tente novamente.')
    } finally {
      setCancelando(false)
    }
  }

  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  if (erro && !venda) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60 }} className="error-text">{erro}</p>
  if (!venda) return null

  const data = new Date(venda.data_hora)
  const cancelada = venda.status === 'cancelada'
  const foiEstorno = cancelada && venda.cancelado_apos_pagamento
  const aguardandoPagamento = venda.status === 'aguardando_pagamento'

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-estreita" style={{ maxWidth: 420 }}>
      <Link href="/historico" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13, marginBottom: 14 }}>← Voltar</Link>

      <h1 style={{ fontSize: 18, fontWeight: 500 }}>
        Venda de {data.toLocaleDateString('pt-BR')} às {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </h1>

      {cancelada && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff9d9d', padding: 10, borderRadius: 10, marginTop: 12, fontSize: 13 }}>
          {foiEstorno ? 'Essa venda foi estornada.' : 'Essa venda foi cancelada antes de ser paga.'}
          {venda.motivo_cancelamento && ` Motivo: ${venda.motivo_cancelamento}`}
        </div>
      )}

      {aguardandoPagamento && (
        <div style={{ background: 'rgba(255,180,84,0.1)', border: '1px solid rgba(255,180,84,0.3)', color: 'var(--amber)', padding: 10, borderRadius: 10, marginTop: 12, fontSize: 13 }}>
          Essa venda ainda está aguardando pagamento.
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

      {venda.pagamentos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p className="section-title">Pagamentos</p>
          {venda.pagamentos.map((p, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: 10 }}>
              <div>
                <div style={{ fontSize: 13 }}>{FORMA_PAGAMENTO_LABEL[p.forma] ?? p.forma}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {p.status === 'confirmado' && 'Confirmado'}
                  {p.status === 'pendente' && 'Aguardando'}
                  {p.status === 'falhou' && 'Não concluído'}
                  {p.status === 'estorno_pendente' && 'Estorno pendente — devolver pelo app da maquininha'}
                  {p.status === 'estornado' && 'Estornado'}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 13 }}>{reais(Number(p.valor))}</div>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="error-text" style={{ marginBottom: 10 }}>{erro}</p>}

      {!cancelada && !mostrarMotivo && (
        <button onClick={() => setMostrarMotivo(true)} className="btn-danger" style={{ width: '100%' }}>
          {aguardandoPagamento ? 'Cancelar venda' : 'Estornar venda'}
        </button>
      )}

      {!cancelada && mostrarMotivo && (
        <div className="card">
          <label className="label">Motivo</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por que está cancelando/estornando?" className="input" style={{ marginBottom: 12 }} />

          {!aguardandoPagamento && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14 }}>
              <input type="checkbox" checked={retornaEstoque} onChange={(e) => setRetornaEstoque(e.target.checked)} />
              Devolver os produtos ao estoque
            </label>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setMostrarMotivo(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
            <button onClick={handleCancelar} disabled={cancelando} className="btn-danger" style={{ flex: 2, padding: 12 }}>
              {cancelando ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {!cancelada && !mostrarMotivo && !aguardandoPagamento && (
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
          Você escolhe se os produtos voltam pro estoque. Pagamentos em dinheiro são estornados na hora pelo caixa; Pix e cartão ficam marcados como pendente, pra você devolver pelo app do banco ou da maquininha.
        </p>
      )}
    </div>
    </>
  )
}
