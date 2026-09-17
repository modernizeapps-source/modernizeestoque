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
  const [explicacaoAberta, setExplicacaoAberta] = useState(false)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <p className="section-title" style={{ marginBottom: 0 }}>Curva ABC</p>
        <button
          onClick={() => setExplicacaoAberta(true)}
          aria-label="O que é curva ABC?"
          style={{ border: '1px solid var(--line-strong)', background: 'var(--panel-2)', color: 'var(--cyan)', cursor: 'pointer', fontSize: 11, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          ?
        </button>
      </div>
      <p className="subtitle">Quais produtos realmente sustentam a receita</p>

      {explicacaoAberta && (
        <div onClick={() => setExplicacaoAberta(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 14, padding: 20, maxWidth: 400, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>O que é curva ABC?</h3>
              <button onClick={() => setExplicacaoAberta(false)} style={{ border: 'none', background: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}>
              <p style={{ marginBottom: 10 }}>
                É uma forma de agrupar seus produtos por importância, do mais pro menos importante:
              </p>

              <p style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--green)', fontWeight: 500 }}>Grupo A:</span> os produtos que juntos geram <b>80% da sua receita</b>. Geralmente são poucos (uns 20% do total). São seus "carro-chefe".
              </p>
              <p style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>Grupo B:</span> os que geram os <b>15% seguintes</b>. Importância média — mantém o giro do negócio.
              </p>
              <p style={{ marginBottom: 14 }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Grupo C:</span> os que geram só os <b>5% restantes</b>. Muitos produtos, pouco impacto na receita.
              </p>

              <p style={{ marginBottom: 10, color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>Exemplo no mercadinho:</b> se você vende 40 produtos, é bem provável que uns 8 (cerveja, refrigerante 2L, salgadinho…) sozinhos representem 80% do faturamento. Se algum desses acabar, é problema sério. Já os 20 com menor giro — se acabar um, quase não afeta.
              </p>

              <p style={{ color: 'var(--text-dim)' }}>
                <b style={{ color: 'var(--text)' }}>Por que serve?</b> Ajuda a saber onde focar atenção: repor o grupo A primeiro, não desperdiçar dinheiro comprando C demais, negociar melhor com fornecedores dos A.
              </p>
            </div>

            <button onClick={() => setExplicacaoAberta(false)} className="btn-primary" style={{ width: '100%', padding: 10, marginTop: 16, fontSize: 13 }}>
              Entendi
            </button>
          </div>
        </div>
      )}

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
