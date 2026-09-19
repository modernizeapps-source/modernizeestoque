'use client'

import { useState } from 'react'
import CalendarioPeriodo from './CalendarioPeriodo'
import { inicioFimPeriodo } from '@/lib/supabase/relatorios'

export type RangePeriodo = { inicio: string; fim: string }

type Props = {
  label: string
  herdando: boolean
  onSelecionar: (range: RangePeriodo, label: string) => void
  onVoltarAoPadrao: () => void
}

function formatarDataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

// Período dos últimos N meses, contando a partir de hoje (fuso de Fortaleza)
function ultimosMeses(meses: number): RangePeriodo {
  const agora = new Date()
  const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(agora).split('-').map(Number)

  const inicioData = new Date(Date.UTC(ano, mes - 1 - meses, dia))
  const fimData = new Date(Date.UTC(ano, mes - 1, dia + 1))
  const fmt = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dd}T00:00:00-03:00`
  }
  return { inicio: fmt(inicioData), fim: fmt(fimData) }
}

const ATALHOS: { id: string; nome: string; montar: () => RangePeriodo }[] = [
  { id: 'semana', nome: 'Esta semana', montar: () => inicioFimPeriodo('semana') },
  { id: 'mes', nome: 'Este mês', montar: () => inicioFimPeriodo('mes') },
  { id: '3m', nome: '3 meses', montar: () => ultimosMeses(3) },
  { id: '6m', nome: '6 meses', montar: () => ultimosMeses(6) },
  { id: '12m', nome: '1 ano', montar: () => ultimosMeses(12) },
]

// Versão pequena e discreta do seletor de período do topo, pra usar dentro de
// uma seção específica do relatório sem competir visualmente com o filtro principal.
export default function SeletorPeriodoCompacto({ label, herdando, onSelecionar, onVoltarAoPadrao }: Props) {
  const [aberto, setAberto] = useState(false)
  const [calendarioAberto, setCalendarioAberto] = useState(false)

  function escolherAtalho(atalho: (typeof ATALHOS)[number]) {
    onSelecionar(atalho.montar(), atalho.nome)
    setAberto(false)
  }

  function escolherNoCalendario(inicioDia: Date, fimDia: Date) {
    const fmt = (d: Date, horaFim: boolean) => {
      const base = new Date(d)
      if (horaFim) base.setUTCDate(base.getUTCDate() + 1)
      const y = base.getUTCFullYear()
      const m = String(base.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(base.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${dd}T00:00:00-03:00`
    }
    const mesmodia = inicioDia.getTime() === fimDia.getTime()
    const texto = mesmodia
      ? formatarDataCurta(inicioDia)
      : `${formatarDataCurta(inicioDia)} – ${formatarDataCurta(fimDia)}`

    onSelecionar({ inicio: fmt(inicioDia, false), fim: fmt(fimDia, true) }, texto)
    setCalendarioAberto(false)
    setAberto(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: herdando ? 'transparent' : 'rgba(79,216,255,0.1)',
          border: `1px solid ${herdando ? 'var(--line)' : 'var(--line-strong)'}`,
          color: herdando ? 'var(--text-dim)' : 'var(--cyan)',
          borderRadius: 999, padding: '3px 10px',
          fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {label} <span style={{ fontSize: 8, opacity: 0.7 }}>▾</span>
      </button>

      {aberto && (
        <>
          <div
            onClick={() => setAberto(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            style={{
              position: 'absolute', top: '130%', right: 0, zIndex: 21,
              background: 'var(--panel)', border: '1px solid var(--line-strong)',
              borderRadius: 10, padding: 6, minWidth: 140,
              boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)',
            }}
          >
            {ATALHOS.map((a) => (
              <div
                key={a.id}
                onClick={() => escolherAtalho(a)}
                style={{ padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6, whiteSpace: 'nowrap' }}
              >
                {a.nome}
              </div>
            ))}

            <div
              onClick={() => { setCalendarioAberto(true); setAberto(false) }}
              style={{ padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6, borderTop: '1px solid var(--line)', marginTop: 4, color: 'var(--cyan)', whiteSpace: 'nowrap' }}
            >
              📅 Escolher datas
            </div>

            {!herdando && (
              <div
                onClick={() => { onVoltarAoPadrao(); setAberto(false) }}
                style={{ padding: '7px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6, borderTop: '1px solid var(--line)', marginTop: 4, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}
              >
                ↺ Seguir o filtro do topo
              </div>
            )}
          </div>
        </>
      )}

      {calendarioAberto && (
        <CalendarioPeriodo onSelecionar={escolherNoCalendario} onFechar={() => setCalendarioAberto(false)} />
      )}
    </div>
  )
}
