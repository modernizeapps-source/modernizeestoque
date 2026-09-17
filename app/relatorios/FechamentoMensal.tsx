'use client'

import { useEffect, useState } from 'react'
import { buscarFechamentoMensal, PontoMensal } from '@/lib/supabase/relatorios'

function reais(v: number) { return `R$ ${v.toFixed(0)}` }
function anoAtualFortaleza(): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric' }).format(new Date()))
}

export default function FechamentoMensal() {
  const [ano, setAno] = useState(anoAtualFortaleza())
  const [pontos, setPontos] = useState<PontoMensal[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    buscarFechamentoMensal(ano).then(setPontos).finally(() => setCarregando(false))
  }, [ano])

  const maior = Math.max(...pontos.map((p) => p.total), 1)
  const totalAno = pontos.reduce((s, p) => s + p.total, 0)
  const mesesComVenda = pontos.filter((p) => p.total > 0)
  const primeiro = mesesComVenda[0]
  const ultimo = mesesComVenda[mesesComVenda.length - 1]
  const cresceu = ultimo && primeiro && ultimo.total > primeiro.total && primeiro !== ultimo

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="section-title">Fechamento mensal</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => setAno((a) => a - 1)} style={{ border: '1px solid var(--line-strong)', borderRadius: '50%', width: 26, height: 26, background: 'var(--panel-2)', color: 'var(--text-dim)', cursor: 'pointer' }}>‹</button>
        <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--cyan)' }}>{ano}</span>
        <button
          onClick={() => setAno((a) => a + 1)}
          disabled={ano >= anoAtualFortaleza()}
          style={{ border: '1px solid var(--line-strong)', borderRadius: '50%', width: 26, height: 26, background: 'var(--panel-2)', color: 'var(--text-dim)', cursor: ano >= anoAtualFortaleza() ? 'default' : 'pointer', opacity: ano >= anoAtualFortaleza() ? 0.4 : 1 }}
        >
          ›
        </button>
      </div>

      {carregando ? (
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Carregando...</p>
      ) : totalAno === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Nenhuma venda registrada em {ano}.</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, marginBottom: 4 }}>
            {pontos.map((p) => {
              const ehUltimoComVenda = ultimo && p.label === ultimo.label
              return (
                <div key={p.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  {p.total > 0 && (
                    <span className="mono" style={{ fontSize: 9, color: '#ffffff', marginBottom: 4, whiteSpace: 'nowrap' }}>
                      {reais(p.total)}
                    </span>
                  )}
                  <div style={{ width: '100%', height: `${Math.max(2, (p.total / maior) * 70)}px`, background: ehUltimoComVenda ? 'linear-gradient(180deg, var(--green), rgba(95,255,176,0.2))' : 'linear-gradient(180deg, var(--cyan), rgba(79,216,255,0.2))', borderRadius: '4px 4px 0 0' }} />
                  <span className="mono" style={{ fontSize: 9, color: ehUltimoComVenda ? 'var(--green)' : 'var(--text-dim)', marginTop: 5 }}>{p.label}</span>
                </div>
              )
            })}
          </div>

          {cresceu !== undefined && primeiro && ultimo && primeiro.label !== ultimo.label && (
            <div style={{ marginTop: 10, padding: '11px 13px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(79,216,255,0.06)', fontSize: 12, color: 'var(--cyan)' }}>
              {cresceu ? '↑' : '↓'} De {reais(primeiro.total)} em {primeiro.label} pra {reais(ultimo.total)} em {ultimo.label}.
            </div>
          )}
        </>
      )}
    </div>
  )
}
