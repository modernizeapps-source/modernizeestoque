'use client'

import { useEffect, useState } from 'react'
import {
  listarHistoricoCaixa, listarVendasDoCaixa,
  CaixaSessao, VendaDoCaixa,
} from '@/lib/supabase/caixa'
import { FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'

function reais(v: number) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`
}

function dataHora(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// Histórico de caixa dentro da própria tela de Caixa, sem virar outra aba.
// O dono consegue abrir cada turno, ver quem operou e conferir as vendas —
// filtrando só as de dinheiro, que são as que afetam a gaveta.
export default function HistoricoCaixa({ aoVoltar }: { aoVoltar: () => void }) {
  const [sessoes, setSessoes] = useState<CaixaSessao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [vendas, setVendas] = useState<VendaDoCaixa[]>([])
  const [carregandoVendas, setCarregandoVendas] = useState(false)
  const [soDinheiro, setSoDinheiro] = useState(false)
  const [filtroPessoa, setFiltroPessoa] = useState<string>('')

  useEffect(() => {
    listarHistoricoCaixa()
      .then(setSessoes)
      .catch(() => setErro('Não foi possível carregar o histórico.'))
      .finally(() => setCarregando(false))
  }, [])

  async function abrir(s: CaixaSessao) {
    if (abertaId === s.id) { setAbertaId(null); return }
    setAbertaId(s.id)
    setSoDinheiro(false)
    setCarregandoVendas(true)
    try {
      setVendas(await listarVendasDoCaixa(s.id))
    } catch {
      setVendas([])
    } finally {
      setCarregandoVendas(false)
    }
  }

  const pessoas = Array.from(new Set(sessoes.map((s) => s.nome_quem_abriu).filter(Boolean))) as string[]
  const filtradas = filtroPessoa ? sessoes.filter((s) => s.nome_quem_abriu === filtroPessoa) : sessoes

  const vendasMostradas = soDinheiro ? vendas.filter((v) => v.valor_em_dinheiro > 0) : vendas
  const totalDinheiroMostrado = vendasMostradas.reduce((soma, v) => soma + v.valor_em_dinheiro, 0)

  if (carregando) {
    return <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '30px 0' }}>Carregando...</p>
  }

  return (
    <div>
      <button onClick={aoVoltar} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13, marginBottom: 16 }}>
        ← Voltar pro caixa
      </button>

      <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: 4 }}>Histórico de caixa</h2>
      <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.5 }}>
        Toque num turno pra ver quem operou e conferir as vendas.
      </p>

      {erro && <p className="error-text">{erro}</p>}

      {/* Filtro por pessoa */}
      {pessoas.length > 1 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={() => setFiltroPessoa('')} className={`pill ${filtroPessoa === '' ? 'pill-active' : ''}`}>
            Todos
          </button>
          {pessoas.map((p) => (
            <button key={p} onClick={() => setFiltroPessoa(p)} className={`pill ${filtroPessoa === p ? 'pill-active' : ''}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {filtradas.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0' }}>
          Nenhum caixa fechado ainda.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtradas.map((s) => {
          const dif = Number(s.divergencia ?? 0)
          const aberta = abertaId === s.id
          return (
            <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => abrir(s)}
                style={{
                  width: '100%', background: 'none', border: 'none', color: 'var(--text)',
                  padding: 15, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      {s.nome_quem_abriu ?? 'Sem registro de quem abriu'}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>
                      {dataHora(s.aberto_em)} → {s.fechado_em ? dataHora(s.fechado_em) : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div className="mono" style={{ fontSize: 13, color: dif === 0 ? 'var(--green)' : dif > 0 ? 'var(--cyan)' : 'var(--amber)' }}>
                      {dif === 0 ? 'bateu' : dif > 0 ? `sobrou ${reais(dif)}` : `faltou ${reais(Math.abs(dif))}`}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>
                      {aberta ? 'fechar ▲' : 'ver vendas ▼'}
                    </div>
                  </div>
                </div>
              </button>

              {aberta && (
                <div style={{ borderTop: '1px solid var(--line)', padding: 15, background: 'rgba(0,0,0,0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                    <span>Inicial <span className="mono" style={{ color: 'var(--text)' }}>{reais(s.valor_inicial)}</span></span>
                    <span>Esperado <span className="mono" style={{ color: 'var(--text)' }}>{reais(s.valor_esperado ?? 0)}</span></span>
                    <span>Contado <span className="mono" style={{ color: 'var(--text)' }}>{reais(s.valor_contado ?? 0)}</span></span>
                  </div>

                  {s.observacao && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 12, fontStyle: 'italic' }}>
                      {s.observacao}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                    <button onClick={() => setSoDinheiro(false)} className={`pill ${!soDinheiro ? 'pill-active' : ''}`}>
                      Todas as vendas
                    </button>
                    <button onClick={() => setSoDinheiro(true)} className={`pill ${soDinheiro ? 'pill-active' : ''}`}>
                      Só dinheiro
                    </button>
                  </div>

                  {carregandoVendas && <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Carregando vendas...</p>}

                  {!carregandoVendas && vendasMostradas.length === 0 && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                      {soDinheiro ? 'Nenhuma venda em dinheiro nesse turno.' : 'Nenhuma venda nesse turno.'}
                    </p>
                  )}

                  {!carregandoVendas && vendasMostradas.map((v, i, arr) => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        gap: 10, padding: '7px 0',
                        borderBottom: i < arr.length - 1 ? '1px dashed var(--line)' : 'none',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <span className="mono" style={{ fontSize: 11.5 }}>{dataHora(v.data_hora)}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-dim)', marginLeft: 8 }}>
                          {v.nome_vendedor ?? '—'}
                        </span>
                        <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>
                          {v.formas.map((f) => FORMA_PAGAMENTO_LABEL[f] ?? f).join(' + ') || '—'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontSize: 12 }}>{reais(v.valor_total)}</div>
                        {soDinheiro && v.valor_em_dinheiro !== v.valor_total && (
                          <div className="mono" style={{ fontSize: 10, color: 'var(--green)', marginTop: 2 }}>
                            {reais(v.valor_em_dinheiro)} em dinheiro
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {!carregandoVendas && soDinheiro && vendasMostradas.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--text-dim)' }}>Total recebido em dinheiro</span>
                      <span className="mono" style={{ color: 'var(--green)' }}>{reais(totalDinheiroMostrado)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
