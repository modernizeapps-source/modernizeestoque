'use client'

import { useState } from 'react'

const DIAS_SEMANA_LABEL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES_LABEL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type Props = { onSelecionar: (inicio: Date, fim: Date) => void; onFechar: () => void }

function hojeUTC(): Date {
  const hojeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza' }).format(new Date())
  const [y, m, d] = hojeStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function mesmaData(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getTime() === b.getTime()
}

export default function CalendarioPeriodo({ onSelecionar, onFechar }: Props) {
  const hoje = hojeUTC()
  const [mesExibido, setMesExibido] = useState(new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1)))
  const [inicio, setInicio] = useState<Date | null>(null)
  const [fim, setFim] = useState<Date | null>(null)

  function handleClickDia(dia: Date) {
    if (!inicio || (inicio && fim)) {
      setInicio(dia)
      setFim(null)
    } else if (dia.getTime() < inicio.getTime()) {
      setFim(inicio)
      setInicio(dia)
    } else {
      setFim(dia)
    }
  }

  function mudarMes(delta: number) {
    setMesExibido((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + delta, 1)))
  }

  function aplicarAtalho(tipo: 'hoje' | 'semana' | 'mes') {
    let ini: Date
    if (tipo === 'hoje') ini = hoje
    else if (tipo === 'semana') ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - hoje.getUTCDay()))
    else ini = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1))
    onSelecionar(ini, hoje)
  }

  const ano = mesExibido.getUTCFullYear()
  const mes = mesExibido.getUTCMonth()
  const primeiroDiaSemana = new Date(Date.UTC(ano, mes, 1)).getUTCDay()
  const diasNoMes = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()

  const celulas: (Date | null)[] = []
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(new Date(Date.UTC(ano, mes, d)))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 16, padding: 20, width: '92%', maxWidth: 340 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => aplicarAtalho('hoje')} className="pill" style={{ fontSize: 12 }}>Hoje</button>
          <button onClick={() => aplicarAtalho('semana')} className="pill" style={{ fontSize: 12 }}>Esta semana</button>
          <button onClick={() => aplicarAtalho('mes')} className="pill" style={{ fontSize: 12 }}>Este mês</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={() => mudarMes(-1)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--text-dim)' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{MESES_LABEL[mes]} {ano}</span>
          <button onClick={() => mudarMes(1)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--text-dim)' }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DIAS_SEMANA_LABEL.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dim)' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 16 }}>
          {celulas.map((dia, i) => {
            if (!dia) return <div key={i} />
            const selecionado = mesmaData(dia, inicio) || mesmaData(dia, fim)
            const noIntervalo = inicio && fim && dia.getTime() > inicio.getTime() && dia.getTime() < fim.getTime()
            const futuro = dia.getTime() > hoje.getTime()
            return (
              <button
                key={i}
                disabled={futuro}
                onClick={() => handleClickDia(dia)}
                className="mono"
                style={{
                  padding: '8px 0', fontSize: 12, border: 'none', cursor: futuro ? 'default' : 'pointer',
                  color: futuro ? 'var(--text-dim)' : selecionado ? '#04141c' : 'var(--text)',
                  background: selecionado ? 'var(--cyan)' : noIntervalo ? 'rgba(79,216,255,0.12)' : 'transparent',
                  borderRadius: 6, opacity: futuro ? 0.4 : 1,
                }}
              >
                {dia.getUTCDate()}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onFechar} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
          <button onClick={() => inicio && onSelecionar(inicio, fim ?? inicio)} disabled={!inicio} className="btn-primary" style={{ flex: 1, opacity: inicio ? 1 : 0.4 }}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
