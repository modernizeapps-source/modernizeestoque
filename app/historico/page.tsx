'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarVendas, VendaResumo, FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function HistoricoPage() {
  const [vendas, setVendas] = useState<VendaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    listarVendas().then(setVendas).catch(() => setErro('Não foi possível carregar o histórico.')).finally(() => setCarregando(false))
  }, [])

  return (
    <div className="container">
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Histórico de vendas</h1>

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}
      {!carregando && !erro && vendas.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhuma venda registrada ainda.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vendas.map((v) => {
          const data = new Date(v.data_hora)
          const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          const cancelada = v.status === 'cancelada'

          return (
            <Link
              key={v.id}
              href={`/historico/${v.id}`}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'var(--text)', opacity: cancelada ? 0.5 : 1 }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{dia} · {hora}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, maxWidth: 220, opacity: 0.85 }}>{v.itensResumo}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  {FORMA_PAGAMENTO_LABEL[v.forma_pagamento] ?? v.forma_pagamento}
                  {cancelada && (
                    <span className="mono" style={{ color: 'var(--red)', marginLeft: 8, fontSize: 9, border: '1px solid var(--red)', borderRadius: 4, padding: '1px 5px' }}>
                      CANCELADA
                    </span>
                  )}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 500, textDecoration: cancelada ? 'line-through' : 'none', color: cancelada ? 'var(--text-dim)' : 'var(--cyan)' }}>
                {reais(v.valor_total)}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
