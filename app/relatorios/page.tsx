'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buscarRelatorio, inicioFimPeriodo, Relatorio, LimitesPeriodo, LIMITES_PADRAO } from '@/lib/supabase/relatorios'
import CalendarioPeriodo from './CalendarioPeriodo'
import EvolucaoDiaSemana from './EvolucaoDiaSemana'
import FechamentoMensal from './FechamentoMensal'
import ConfigPeriodosDia, { lerLimitesPeriodo } from './ConfigPeriodosDia'

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
}

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function formatarDataCurta(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

export default function RelatoriosPage() {
  const [periodoLabel, setPeriodoLabel] = useState('Este mês')
  const [range, setRange] = useState(() => inicioFimPeriodo('mes'))
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [limitesPeriodo, setLimitesPeriodo] = useState<LimitesPeriodo>(LIMITES_PADRAO)
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false)

  useEffect(() => {
    setLimitesPeriodo(lerLimitesPeriodo())
  }, [])

  useEffect(() => {
    setCarregando(true)
    buscarRelatorio(range.inicio, range.fim, limitesPeriodo).then(setRelatorio).catch(() => setErro('Não foi possível carregar o relatório.')).finally(() => setCarregando(false))
  }, [range, limitesPeriodo])

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

    const hoje = new Date().toISOString().slice(0, 10)
    const mesmodia = inicioDia.getTime() === fimDia.getTime()
    if (mesmodia && inicioDia.toISOString().slice(0, 10) === hoje) setPeriodoLabel('Hoje')
    else if (mesmodia) setPeriodoLabel(formatarDataCurta(inicioDia))
    else setPeriodoLabel(`${formatarDataCurta(inicioDia)} – ${formatarDataCurta(fimDia)}`)

    setSeletorAberto(false)
  }

  const totaisPorDia = relatorio ? relatorio.porDiaSemana.map((d) => d.total) : []
  const maiorDiaSemana = totaisPorDia.length > 0 ? Math.max(...totaisPorDia, 1) : 1

  return (
    <div className="container">
      <Link href="/" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>Relatórios</h1>

      <button onClick={() => setSeletorAberto(true)} className="btn-primary" style={{ marginBottom: 20 }}>
        📅 {periodoLabel} ▾
      </button>

      {seletorAberto && <CalendarioPeriodo onSelecionar={handleSelecionarPeriodo} onFechar={() => setSeletorAberto(false)} />}

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}

      {relatorio && !carregando && (
        <>
          <p className="section-title">Visão geral</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total vendido</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6, color: 'var(--cyan)' }}>{reais(relatorio.totalVendido)}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lucro</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6, color: 'var(--green)' }}>{reais(relatorio.lucro)}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vendas</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{relatorio.numVendas}</div>
            </div>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ticket médio</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{reais(relatorio.ticketMedio)}</div>
            </div>
          </div>

          <p className="section-title" style={{ marginBottom: 2 }}>Total por dia da semana</p>
          <p className="subtitle">Soma de todas as ocorrências do período</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, marginBottom: 4 }}>
            {relatorio.porDiaSemana.map((d) => (
              <div key={d.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <span className="mono" style={{ fontSize: 8.5, color: '#ffffff', marginBottom: 5, whiteSpace: 'nowrap' }}>{d.total > 0 ? reais(d.total) : ''}</span>
                <div style={{ width: '100%', height: `${Math.max(4, (d.total / maiorDiaSemana) * 80)}px`, background: 'linear-gradient(180deg, var(--cyan), rgba(79,216,255,0.2))', borderRadius: '5px 5px 0 0' }} />
                <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', marginTop: 5 }}>{d.dia}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 20 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Por período do dia</p>
            <ConfigPeriodosDia limites={limitesPeriodo} onSalvar={setLimitesPeriodo} />
          </div>
          <div style={{ marginTop: 10, marginBottom: 24 }}>
            {relatorio.porPeriodoDia.map((p) => (
              <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nome}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', opacity: 0.8 }}>{p.horario}{p.topProduto ? ` · Top: ${p.topProduto}` : ''}</div>
                </div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--cyan)' }}>{reais(p.total)}</div>
              </div>
            ))}
          </div>

          <EvolucaoDiaSemana />
          <FechamentoMensal />

          <p className="section-title">Lucro por categoria</p>
          <div className="card" style={{ marginBottom: 24 }}>
            {relatorio.porCategoria.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Sem vendas nesse período.</p>}
            {(mostrarTodasCategorias ? relatorio.porCategoria : relatorio.porCategoria.slice(0, 8)).map((c) => {
              const maior = Math.max(...relatorio.porCategoria.map((x) => x.lucro), 1)
              return (
                <div key={c.nome} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span>{c.nome}</span>
                    <span className="mono" style={{ color: 'var(--green)' }}>{reais(c.lucro)}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(c.lucro / maior) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                  </div>
                </div>
              )
            })}
            {relatorio.porCategoria.length > 8 && (
              <button
                onClick={() => setMostrarTodasCategorias(!mostrarTodasCategorias)}
                style={{ border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}
              >
                {mostrarTodasCategorias ? 'Ver menos' : `Ver todas (${relatorio.porCategoria.length})`}
              </button>
            )}
          </div>

          <p className="section-title">Produtos</p>
          <div className="card" style={{ marginBottom: 24 }}>
            <p className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Mais vendidos</p>
            {relatorio.maisVendidos.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Sem vendas nesse período.</p>}
            {relatorio.maisVendidos.map((p, i) => (
              <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)', fontSize: 12 }}>
                <span>{i + 1}. {p.nome}</span>
                <span className="mono" style={{ color: 'var(--text-dim)' }}>{p.quantidade} un</span>
                <span className="mono" style={{ color: 'var(--green)' }}>{reais(p.valor)}</span>
              </div>
            ))}

            <div style={{ height: 12 }} />
            <p className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Menos vendidos</p>
            {relatorio.menosVendidos.map((p) => (
              <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line)', fontSize: 12 }}>
                <span>↓ {p.nome}</span>
                <span className="mono" style={{ color: 'var(--text-dim)' }}>{p.quantidade} un</span>
                <span className="mono" style={{ color: 'var(--amber)' }}>{reais(p.valor)}</span>
              </div>
            ))}
          </div>

          <p className="section-title">Formas de pagamento</p>
          <div>
            {relatorio.formasPagamento.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Sem vendas nesse período.</p>}
            {relatorio.formasPagamento.map((f) => (
              <div key={f.forma} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span>{FORMA_PAGAMENTO_LABEL[f.forma] ?? f.forma}</span>
                  <span className="mono">{f.percentual.toFixed(0)}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${f.percentual}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
