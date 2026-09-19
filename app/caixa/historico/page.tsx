'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listarHistoricoCaixa, CaixaSessao } from '@/lib/supabase/caixa'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function HistoricoCaixaPage() {
  const [sessoes, setSessoes] = useState<CaixaSessao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    listarHistoricoCaixa()
      .then(setSessoes)
      .catch(() => setErro('Não foi possível carregar o histórico.'))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <Link href="/caixa" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Histórico de caixa</h1>

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}
      {!carregando && !erro && sessoes.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhum caixa fechado ainda.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessoes.map((s) => {
          const abertura = new Date(s.aberto_em)
          const fechamento = s.fechado_em ? new Date(s.fechado_em) : null
          const divergenciaOk = s.divergencia !== null && Math.abs(Number(s.divergencia)) < 0.01
          return (
            <div key={s.id} className="card">
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {abertura.toLocaleDateString('pt-BR')} · {abertura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {fechamento && ` – ${fechamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>Inicial: <span className="mono">{reais(Number(s.valor_inicial))}</span></span>
                <span>Esperado: <span className="mono">{reais(Number(s.valor_esperado ?? 0))}</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                <span style={{ color: 'var(--text-dim)' }}>Contado: <span className="mono">{reais(Number(s.valor_contado ?? 0))}</span></span>
                <span className="mono" style={{ color: divergenciaOk ? 'var(--green)' : 'var(--amber)' }}>
                  {Number(s.divergencia ?? 0) >= 0 ? '+' : ''}{reais(Number(s.divergencia ?? 0))}
                </span>
              </div>
              {s.observacao && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{s.observacao}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
