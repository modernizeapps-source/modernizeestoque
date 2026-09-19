'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarVendas, VendaResumo, FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import CalendarioPeriodo from '../relatorios/CalendarioPeriodo'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function formatarDataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

export default function HistoricoPage() {
  const [vendas, setVendas] = useState<VendaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtroLabel, setFiltroLabel] = useState('Todas as vendas')
  const [range, setRange] = useState<{ inicio?: string; fim?: string }>({})
  const [seletorAberto, setSeletorAberto] = useState(false)

  useEffect(() => {
    setCarregando(true)
    listarVendas(range.inicio, range.fim)
      .then(setVendas)
      .catch(() => setErro('Não foi possível carregar o histórico.'))
      .finally(() => setCarregando(false))
  }, [range])

  function handleSelecionarPeriodo(inicioDia: Date, fimDia: Date) {
    const fmt = (d: Date, horaFim: boolean) => {
      const base = new Date(d)
      if (horaFim) base.setUTCDate(base.getUTCDate() + 1)
      const y = base.getUTCFullYear()
      const m = String(base.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(base.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${dd}T00:00:00-03:00`
    }
    setRange({ inicio: fmt(inicioDia, false), fim: fmt(fimDia, true) })

    const mesmodia = inicioDia.getTime() === fimDia.getTime()
    if (mesmodia) setFiltroLabel(formatarDataCurta(inicioDia))
    else setFiltroLabel(`${formatarDataCurta(inicioDia)} – ${formatarDataCurta(fimDia)}`)

    setSeletorAberto(false)
  }

  function limparFiltro() {
    setRange({})
    setFiltroLabel('Todas as vendas')
  }

  return (
    <div className="container">
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Histórico de vendas</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setSeletorAberto(true)} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
          📅 {filtroLabel} ▾
        </button>
        {range.inicio && (
          <button onClick={limparFiltro} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Limpar
          </button>
        )}
      </div>

      {seletorAberto && (
        <CalendarioPeriodo onSelecionar={handleSelecionarPeriodo} onFechar={() => setSeletorAberto(false)} />
      )}

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}
      {!carregando && !erro && vendas.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
          {range.inicio ? 'Nenhuma venda encontrada nesse período.' : 'Nenhuma venda registrada ainda.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vendas.map((v) => {
          const data = new Date(v.data_hora)
          const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          const cancelada = v.status === 'cancelada'
          const aguardando = v.status === 'aguardando_pagamento'

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
                      {v.cancelado_apos_pagamento ? 'ESTORNADA' : 'CANCELADA'}
                    </span>
                  )}
                  {aguardando && (
                    <span className="mono" style={{ color: 'var(--amber)', marginLeft: 8, fontSize: 9, border: '1px solid var(--amber)', borderRadius: 4, padding: '1px 5px' }}>
                      AGUARDANDO
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
