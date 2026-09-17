'use client'

import { useEffect, useState } from 'react'
import { buscarCurvaABC, CurvaABC as CurvaABCTipo, ProdutoCurvaABC } from '@/lib/supabase/relatorios'

function reais(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}` }

const CORES_GRUPO: Record<'A' | 'B' | 'C', string> = {
  A: 'var(--green)',
  B: 'var(--cyan)',
  C: 'var(--text-dim)',
}

type Props = { inicio: string; fim: string }

export default function CurvaABCSecao({ inicio, fim }: Props) {
  const [dados, setDados] = useState<CurvaABCTipo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [expandido, setExpandido] = useState(false)
  const [filtroGrupo, setFiltroGrupo] = useState<'todos' | 'A' | 'B' | 'C'>('todos')

  useEffect(() => {
    setCarregando(true)
    buscarCurvaABC(inicio, fim).then(setDados).finally(() => setCarregando(false))
  }, [inicio, fim])

  if (carregando) return <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>Carregando análise ABC...</p>
  if (!dados) return null

  const totalProdutos = dados.resumo.A + dados.resumo.B + dados.resumo.C

  const produtosFiltrados = filtroGrupo === 'todos'
    ? dados.produtos
    : dados.produtos.filter((p: ProdutoCurvaABC) => p.grupo === filtroGrupo)

  return (
    <div style={{ marginBottom: 24 }}>
      <p className="section-title">Curva ABC</p>
      <p className="subtitle">Quais produtos realmente sustentam a receita</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="card" style={{ padding: 10, textAlign: 'center', borderLeft: '3px solid var(--green)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>A</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--green)', marginTop: 4 }}>{dados.resumo.A}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>~80% receita</div>
        </div>
        <div className="card" style={{ padding: 10, textAlign: 'center', borderLeft: '3px solid var(--cyan)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>B</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--cyan)', marginTop: 4 }}>{dados.resumo.B}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>~15% receita</div>
        </div>
        <div className="card" style={{ padding: 10, textAlign: 'center', borderLeft: '3px solid var(--text-dim)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>C</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-dim)', marginTop: 4 }}>{dados.resumo.C}</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>~5% receita</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <p className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 10 }}>Conselhos</p>
        {dados.conselhos.map((c: string, i: number) => (
          <p key={i} style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{c}</p>
        ))}
      </div>

      {totalProdutos > 0 && (
        <button
          onClick={() => setExpandido(!expandido)}
          style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10 }}
        >
          {expandido ? 'Esconder lista completa' : 'Ver todos os produtos por grupo'}
        </button>
      )}

      {expandido && totalProdutos > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {(['todos', 'A', 'B', 'C'] as const).map((g) => (
              <button key={g} onClick={() => setFiltroGrupo(g)} className={`pill ${filtroGrupo === g ? 'pill-active' : ''}`} style={{ fontSize: 11 }}>
                {g === 'todos' ? 'Todos' : g}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0 }}>
            {produtosFiltrados.map((p: ProdutoCurvaABC, i: number) => (
              <div key={p.produto_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: i === produtosFiltrados.length - 1 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span className="mono" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: CORES_GRUPO[p.grupo], border: `1px solid ${CORES_GRUPO[p.grupo]}` }}>{p.grupo}</span>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.percentualReceita.toFixed(1)}%</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--cyan)', minWidth: 60, textAlign: 'right' }}>{reais(p.totalVendido)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
