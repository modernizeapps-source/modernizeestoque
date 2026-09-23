'use client'

import Link from 'next/link'
import { ResumoHoje, PainelDesktop } from '@/lib/supabase/dashboard'
import { FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import { textoReposicao } from '@/lib/supabase/produtos'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

const CORES_FORMA = ['var(--cyan)', 'var(--green)', 'var(--pink)', 'var(--amber)', 'var(--text-dim)']

function Bloco({ titulo, children, extra, acento }: {
  titulo: string
  children: React.ReactNode
  extra?: React.ReactNode
  acento?: 'ciano' | 'ambar'
}) {
  return (
    <div style={{
      background: acento === 'ciano' ? 'rgba(79,216,255,0.03)' : acento === 'ambar' ? 'rgba(255,180,84,0.03)' : 'var(--panel)',
      border: `1px solid ${acento === 'ciano' ? 'var(--line-strong)' : acento === 'ambar' ? 'rgba(255,180,84,0.28)' : 'var(--line)'}`,
      borderRadius: 12, padding: 17,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <span className="mono" style={{
          fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase',
          color: acento === 'ambar' ? 'var(--amber)' : 'var(--text-dim)',
        }}>
          {titulo}
        </span>
        {extra}
      </div>
      {children}
    </div>
  )
}

export default function PainelInicioDesktop({ resumo, painel }: { resumo: ResumoHoje; painel: PainelDesktop | null }) {
  const hoje = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza', weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  const maiorDia = painel ? Math.max(...painel.ultimos7Dias.map((d) => d.total), 1) : 1

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto', padding: '0 32px 48px' }}>

      {/* ——— Cabeçalho com a ação principal ——— */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Resumo de hoje</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 12.5, marginTop: 5, marginBottom: 0, textTransform: 'capitalize' }}>
            {hoje}
          </p>
        </div>
        <Link
          href="/venda"
          className="btn-primary"
          style={{
            padding: '14px 30px', fontSize: 15, gap: 9,
            boxShadow: '0 0 24px -6px rgba(79,216,255,0.5)', whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> Nova venda
        </Link>
      </div>

      {/* ——— Os quatro números do dia ———
           Ordem pensada pra que "Total vendido" fique alinhado embaixo do
           botão Nova venda, que fica no canto direito do cabeçalho. ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <Link
          href="/produtos"
          className="card card-clicavel"
          style={{
            padding: 17, textDecoration: 'none', color: 'var(--text)', display: 'block',
            borderColor: resumo.produtosEstoqueBaixo > 0 ? 'rgba(255,180,84,0.4)' : undefined,
          }}
        >
          <div className="mono" style={{
            fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: resumo.produtosEstoqueBaixo > 0 ? 'var(--amber)' : 'var(--text-dim)',
          }}>
            Estoque baixo
          </div>
          <div className="mono" style={{
            fontSize: 25, fontWeight: 500, marginTop: 7,
            color: resumo.produtosEstoqueBaixo > 0 ? 'var(--amber)' : 'var(--text)',
          }}>
            {resumo.produtosEstoqueBaixo}
          </div>
          <div style={{ fontSize: 10.5, marginTop: 4, color: 'var(--text-dim)' }}>ver produtos →</div>
        </Link>

        <div className="card" style={{ padding: 17 }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vendas hoje</div>
          <div className="mono" style={{ fontSize: 25, fontWeight: 500, marginTop: 7 }}>{resumo.numVendas}</div>
          <div style={{ fontSize: 10.5, marginTop: 4, color: 'var(--text-dim)' }}>
            {painel && painel.ticketMedio > 0 ? `ticket médio ${reais(painel.ticketMedio)}` : '—'}
          </div>
        </div>

        <div className="card card-accent" style={{ padding: 17 }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lucro</div>
          <div className="mono" style={{ fontSize: 25, fontWeight: 500, marginTop: 7, color: 'var(--green)' }}>{reais(resumo.lucro)}</div>
          <div style={{ fontSize: 10.5, marginTop: 4, color: 'var(--text-dim)' }}>
            {painel && painel.taxasTotal > 0 ? `já sem ${reais(painel.taxasTotal)} de taxas` : 'sem taxas no período'}
          </div>
        </div>

        <div className="card card-accent" style={{ padding: 17 }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total vendido</div>
          <div className="mono" style={{ fontSize: 25, fontWeight: 500, marginTop: 7, color: 'var(--cyan)' }}>{reais(resumo.totalVendido)}</div>
          {painel?.variacaoVsOntem != null && (
            <div style={{ fontSize: 10.5, marginTop: 4, color: painel.variacaoVsOntem >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {painel.variacaoVsOntem >= 0 ? '↑' : '↓'} {Math.abs(painel.variacaoVsOntem).toFixed(0)}% vs ontem
            </div>
          )}
          {painel?.variacaoVsOntem == null && (
            <div style={{ fontSize: 10.5, marginTop: 4, color: 'var(--text-dim)' }}>sem venda ontem</div>
          )}
        </div>
      </div>

      {/* ——— Duas colunas ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Bloco titulo="Últimos 7 dias">
            {painel ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 104 }}>
                {painel.ultimos7Dias.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <span className="mono" style={{ fontSize: 9, color: d.ehHoje ? 'var(--cyan)' : 'var(--text-dim)', opacity: d.total > 0 ? 1 : 0.4 }}>
                      {d.total > 0 ? Math.round(d.total) : ''}
                    </span>
                    <div
                      title={`${d.rotulo}: ${reais(d.total)}`}
                      style={{
                        width: '100%',
                        height: `${Math.max(3, (d.total / maiorDia) * 100)}%`,
                        background: d.ehHoje
                          ? 'linear-gradient(180deg, var(--cyan), #2a7a9a)'
                          : 'linear-gradient(180deg, #2a6a8a, #1a4a5a)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: d.ehHoje ? '0 0 14px rgba(79,216,255,0.28)' : 'none',
                        minHeight: 3,
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: d.ehHoje ? 'var(--cyan)' : 'var(--text-dim)' }}>{d.rotulo}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Carregando...</p>
            )}
          </Bloco>

          <Bloco
            titulo="Últimas vendas"
            extra={<Link href="/historico" style={{ color: 'var(--cyan)', fontSize: 11, textDecoration: 'none' }}>ver todas →</Link>}
          >
            {!painel && <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Carregando...</p>}
            {painel && painel.ultimasVendas.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)', padding: '10px 0' }}>Nenhuma venda registrada hoje ainda.</p>
            )}
            {painel?.ultimasVendas.map((v, i, arr) => (
              <Link
                key={v.id}
                href={`/historico/${v.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px dashed var(--line)' : 'none',
                  textDecoration: 'none', color: 'var(--text)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span className="mono" style={{ color: 'var(--text)' }}>{v.hora}</span>
                  {v.resumo && ` · ${v.resumo}`}
                </span>
                <span className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{reais(v.valor)}</span>
              </Link>
            ))}
          </Bloco>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Bloco titulo="Caixa" acento={painel?.caixaAberto ? 'ciano' : undefined}>
            {painel?.caixaAberto ? (
              <>
                <div className="mono" style={{ fontSize: 21, fontWeight: 500, color: 'var(--green)' }}>
                  {reais(painel.caixaAberto.saldoDinheiro)}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
                  aberto às {painel.caixaAberto.abertoEm} · em dinheiro
                </div>
                <Link href="/caixa" className="btn-secondary" style={{ width: '100%', marginTop: 13, padding: 9, fontSize: 12.5, justifyContent: 'center' }}>
                  Ver caixa
                </Link>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: 'var(--amber)', marginTop: 0, marginBottom: 12 }}>
                  Nenhum caixa aberto hoje.
                </p>
                <Link href="/caixa" className="btn-primary" style={{ width: '100%', padding: 10, fontSize: 13, justifyContent: 'center' }}>
                  Abrir caixa
                </Link>
              </>
            )}
          </Bloco>

          <Bloco titulo="Como pagaram hoje">
            {resumo.formasPagamento.length === 0 && (
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Sem vendas hoje.</p>
            )}
            {resumo.formasPagamento.map((f, i) => (
              <div key={f.forma} style={{ marginBottom: i < resumo.formasPagamento.length - 1 ? 11 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12 }}>{FORMA_PAGAMENTO_LABEL[f.forma] ?? f.forma}</span>
                  <span className="mono" style={{ fontSize: 12 }}>{reais(f.valor)}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${f.percentual}%`, height: '100%', background: CORES_FORMA[i % CORES_FORMA.length], borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </Bloco>

          {painel && painel.produtosParaRepor.length > 0 && (
            <Bloco titulo="Precisa repor" acento="ambar">
              {painel.produtosParaRepor.map((p, i, arr) => {
                const repor = textoReposicao(p.estoque, p.minimo, p.unidadesPorFardo)
                return (
                  <Link
                    key={p.id}
                    href={`/produtos/${p.id}`}
                    style={{
                      display: 'block', padding: '8px 0',
                      borderBottom: i < arr.length - 1 ? '1px dashed var(--line)' : 'none',
                      textDecoration: 'none', color: 'var(--text)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12.5 }}>{p.nome}</span>
                      {repor && (
                        <span className="mono" style={{ fontSize: 12, color: 'var(--amber)' }}>
                          repor {repor}
                        </span>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      tem {p.estoque} · mínimo {p.minimo}
                    </div>
                  </Link>
                )
              })}
            </Bloco>
          )}
        </div>
      </div>
    </div>
  )
}
