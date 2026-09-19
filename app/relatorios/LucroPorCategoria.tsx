'use client'

import { useEffect, useState } from 'react'
import { buscarLucroPorCategoria } from '@/lib/supabase/relatorios'
import SeletorPeriodoCompacto, { RangePeriodo } from './SeletorPeriodoCompacto'

type Props = {
  rangeDoTopo: RangePeriodo
  labelDoTopo: string
}

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

// Lucro por categoria com seletor de período próprio. Por padrão acompanha o
// filtro do topo do relatório; se o usuário escolher um período aqui, essa
// seção passa a andar sozinha, sem mexer no resto da tela.
export default function LucroPorCategoria({ rangeDoTopo, labelDoTopo }: Props) {
  const [rangeProprio, setRangeProprio] = useState<RangePeriodo | null>(null)
  const [labelProprio, setLabelProprio] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<{ nome: string; lucro: number }[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarTodas, setMostrarTodas] = useState(false)

  const herdando = rangeProprio === null
  const range = rangeProprio ?? rangeDoTopo
  const label = labelProprio ?? labelDoTopo

  useEffect(() => {
    setCarregando(true)
    buscarLucroPorCategoria(range.inicio, range.fim)
      .then(setCategorias)
      .catch(() => setCategorias([]))
      .finally(() => setCarregando(false))
  }, [range.inicio, range.fim])

  const maior = categorias.length > 0 ? Math.max(...categorias.map((c) => c.lucro), 1) : 1
  const visiveis = mostrarTodas ? categorias : categorias.slice(0, 8)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <p className="section-title" style={{ marginBottom: 0 }}>Lucro por categoria</p>
        <SeletorPeriodoCompacto
          label={label}
          herdando={herdando}
          onSelecionar={(r, l) => { setRangeProprio(r); setLabelProprio(l); setMostrarTodas(false) }}
          onVoltarAoPadrao={() => { setRangeProprio(null); setLabelProprio(null) }}
        />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        {carregando && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Carregando...</p>}
        {!carregando && categorias.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Sem vendas nesse período.</p>
        )}

        {!carregando && visiveis.map((c) => (
          <div key={c.nome} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
              <span>{c.nome}</span>
              <span className="mono" style={{ color: 'var(--green)' }}>{reais(c.lucro)}</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, (c.lucro / maior) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
            </div>
          </div>
        ))}

        {!carregando && categorias.length > 8 && (
          <button
            onClick={() => setMostrarTodas(!mostrarTodas)}
            style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}
          >
            {mostrarTodas ? 'Ver menos' : `Ver todas (${categorias.length})`}
          </button>
        )}
      </div>
    </>
  )
}
