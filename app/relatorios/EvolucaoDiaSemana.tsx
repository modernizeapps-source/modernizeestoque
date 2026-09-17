'use client'

import { useEffect, useState } from 'react'
import { buscarEvolucaoDiaSemana, PontoEvolucao } from '@/lib/supabase/relatorios'

const DIAS = [
  { id: 0, nome: 'Dom' }, { id: 1, nome: 'Seg' }, { id: 2, nome: 'Ter' }, { id: 3, nome: 'Qua' },
  { id: 4, nome: 'Qui' }, { id: 5, nome: 'Sex' }, { id: 6, nome: 'Sáb' },
]

function reais(v: number) { return `R$ ${v.toFixed(0)}` }

function diaSemanaAtualFortaleza(): number {
  const nomeCurto = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Fortaleza', weekday: 'short' }).format(new Date())
  const mapa: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return mapa[nomeCurto] ?? 1
}

export default function EvolucaoDiaSemana() {
  const [diaSelecionado, setDiaSelecionado] = useState(diaSemanaAtualFortaleza)
  const [pontos, setPontos] = useState<PontoEvolucao[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    buscarEvolucaoDiaSemana(diaSelecionado).then(setPontos).finally(() => setCarregando(false))
  }, [diaSelecionado])

  const maior = Math.max(...pontos.map((p) => p.total), 1)
  const largura = 320
  const altura = 90
  const passoX = pontos.length > 1 ? largura / (pontos.length - 1) : 0
  const coordenadas = pontos.map((p, i) => ({ x: i * passoX, y: altura - (p.total / maior) * altura, total: p.total, label: p.label }))
  const linhaSvg = coordenadas.map((c) => `${c.x},${c.y}`).join(' ')

  const primeiro = pontos[0]
  const ultimo = pontos[pontos.length - 1]
  const cresceu = ultimo && primeiro && ultimo.total > primeiro.total

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="section-title" style={{ marginBottom: 2 }}>Evolução histórica por dia</p>
      <p className="subtitle">Total do dia escolhido, mês a mês</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {DIAS.map((d) => (
          <button key={d.id} onClick={() => setDiaSelecionado(d.id)} className={`pill ${diaSelecionado === d.id ? 'pill-active' : ''}`} style={{ fontSize: 11, padding: '5px 11px' }}>
            {d.nome}
          </button>
        ))}
      </div>

      {carregando ? (
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Carregando...</p>
      ) : (
        <>
          <svg viewBox={`-10 -18 ${largura + 20} ${altura + 30}`} style={{ width: '100%', height: 130 }}>
            <polyline points={linhaSvg} fill="none" stroke="#4fd8ff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            {coordenadas.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={i === coordenadas.length - 1 ? 4 : 2.5} fill={i === coordenadas.length - 1 ? '#5fffb0' : '#4fd8ff'} />
                <text x={c.x} y={c.y - 8} fontSize="8.5" textAnchor="middle" fill="#7f93a8">{c.total > 0 ? reais(c.total) : ''}</text>
                <text x={c.x} y={altura + 14} fontSize="9.5" textAnchor="middle" fill="#7f93a8">{c.label}</text>
              </g>
            ))}
          </svg>

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
