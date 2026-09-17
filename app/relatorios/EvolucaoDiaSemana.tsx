'use client'

import { useEffect, useMemo, useState } from 'react'
import { buscarEvolucaoDiaSemana, PontoEvolucao } from '@/lib/supabase/relatorios'

const DIAS = [
  { id: 0, nome: 'Dom' }, { id: 1, nome: 'Seg' }, { id: 2, nome: 'Ter' }, { id: 3, nome: 'Qua' },
  { id: 4, nome: 'Qui' }, { id: 5, nome: 'Sex' }, { id: 6, nome: 'Sáb' },
]

const PERIODOS = [
  { id: '3', nome: '3M', meses: 3 },
  { id: '6', nome: '6M', meses: 6 },
  { id: '12', nome: '12M', meses: 12 },
]

function reais(v: number) { return `R$ ${v.toFixed(0)}` }

function diaSemanaAtualFortaleza(): number {
  const nomeCurto = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Fortaleza', weekday: 'short' }).format(new Date())
  const mapa: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return mapa[nomeCurto] ?? 1
}

export default function EvolucaoDiaSemana() {
  const [diaSelecionado, setDiaSelecionado] = useState(diaSemanaAtualFortaleza)
  const [periodoSelecionado, setPeriodoSelecionado] = useState('6')
  const [compararAnoAnterior, setCompararAnoAnterior] = useState(false)

  const [pontosAtual, setPontosAtual] = useState<PontoEvolucao[]>([])
  const [pontosAnterior, setPontosAnterior] = useState<PontoEvolucao[]>([])
  const [carregando, setCarregando] = useState(true)

  const numMeses = useMemo(() => PERIODOS.find((p) => p.id === periodoSelecionado)?.meses ?? 6, [periodoSelecionado])

  useEffect(() => {
    setCarregando(true)
    const promessas: Promise<PontoEvolucao[]>[] = [buscarEvolucaoDiaSemana(diaSelecionado, numMeses)]
    if (compararAnoAnterior) {
      promessas.push(buscarEvolucaoDiaSemana(diaSelecionado, numMeses, 12))
    }
    Promise.all(promessas)
      .then((res) => {
        setPontosAtual(res[0])
        setPontosAnterior(res[1] ?? [])
      })
      .finally(() => setCarregando(false))
  }, [diaSelecionado, numMeses, compararAnoAnterior])

  const todosValores = [...pontosAtual.map((p) => p.total), ...pontosAnterior.map((p) => p.total)]
  const maior = Math.max(...todosValores, 1)

  const largura = 320
  const altura = 90
  const passoX = pontosAtual.length > 1 ? largura / (pontosAtual.length - 1) : 0

  const coordAtual = pontosAtual.map((p, i) => ({
    x: i * passoX,
    y: altura - (p.total / maior) * altura,
    total: p.total,
    label: p.label,
  }))

  const coordAnterior = compararAnoAnterior
    ? pontosAnterior.map((p, i) => ({
        x: i * passoX,
        y: altura - (p.total / maior) * altura,
        total: p.total,
        label: p.label,
      }))
    : []

  const linhaAtual = coordAtual.map((c) => `${c.x},${c.y}`).join(' ')
  const linhaAnterior = coordAnterior.map((c) => `${c.x},${c.y}`).join(' ')

  const primeiro = pontosAtual[0]
  const ultimo = pontosAtual[pontosAtual.length - 1]
  const cresceu = ultimo && primeiro && ultimo.total > primeiro.total

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="section-title" style={{ marginBottom: 2 }}>Evolução histórica por dia</p>
      <p className="subtitle">Total do dia escolhido, mês a mês</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        {DIAS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDiaSelecionado(d.id)}
            className={`pill ${diaSelecionado === d.id ? 'pill-active' : ''}`}
            style={{ fontSize: 11, padding: '5px 11px' }}
          >
            {d.nome}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodoSelecionado(p.id)}
            className={`pill ${periodoSelecionado === p.id ? 'pill-active' : ''}`}
            style={{ fontSize: 11, padding: '5px 11px' }}
          >
            {p.nome}
          </button>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={compararAnoAnterior}
          onChange={(e) => setCompararAnoAnterior(e.target.checked)}
          style={{ accentColor: 'var(--cyan)' }}
        />
        Comparar com o ano anterior
      </label>

      {carregando ? (
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Carregando...</p>
      ) : (
        <>
          <svg viewBox={`-25 -26 ${largura + 50} ${altura + 48}`} style={{ width: '100%', height: 150 }}>
            {compararAnoAnterior && (
              <>
                <polyline points={linhaAnterior} fill="none" stroke="#ffb454" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" opacity={0.7} />
                {coordAnterior.map((c, i) => (
                  <circle key={`ant-${i}`} cx={c.x} cy={c.y} r={2} fill="#ffb454" opacity={0.7} />
                ))}
              </>
            )}

            <polyline points={linhaAtual} fill="none" stroke="#4fd8ff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            {coordAtual.map((c, i) => {
              const acimaOuAbaixo = c.y < 20 ? c.y + 14 : c.y - 8
              return (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r={i === coordAtual.length - 1 ? 4 : 2.5} fill={i === coordAtual.length - 1 ? '#5fffb0' : '#4fd8ff'} />
                  <text x={c.x} y={acimaOuAbaixo} fontSize="8.5" textAnchor="middle" fill="#ffffff">
                    {c.total > 0 ? reais(c.total) : ''}
                  </text>
                  <text x={c.x} y={altura + 14} fontSize="9" textAnchor="middle" fill="#7f93a8">{c.label}</text>
                </g>
              )
            })}
          </svg>

          {compararAnoAnterior && (
            <div style={{ display: 'flex', gap: 14, fontSize: 11, marginBottom: 10 }}>
              <span style={{ color: 'var(--cyan)' }}>— Atual</span>
              <span style={{ color: '#ffb454' }}>-- Ano anterior</span>
            </div>
          )}

          {primeiro && ultimo && primeiro.total > 0 && (
            <div style={{ marginTop: 6, padding: '11px 13px', borderRadius: 12, border: '1px solid var(--line-strong)', background: 'rgba(79,216,255,0.06)', fontSize: 12, color: 'var(--cyan)' }}>
              {cresceu ? '↑' : '↓'} As {DIAS.find((d) => d.id === diaSelecionado)?.nome}-feiras {cresceu ? 'cresceram' : 'caíram'}: de {reais(primeiro.total)} em {primeiro.label} pra {reais(ultimo.total)} em {ultimo.label}.
            </div>
          )}
        </>
      )}
    </div>
  )
}
