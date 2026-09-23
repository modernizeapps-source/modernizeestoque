'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  buscarCaixaAberto,
  abrirCaixa,
  registrarMovimentoCaixa,
  listarMovimentosCaixa,
  fecharCaixa,
  totaisPorFormaDoCaixa,
  CaixaSessao,
  CaixaMovimento,
  corrigirValorInicialCaixa,
} from '@/lib/supabase/caixa'
import { FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import HistoricoCaixa from './HistoricoCaixa'
import { useSessao } from '../SessaoProvider'
import { podeVerDinheiroDoNegocio } from '@/lib/supabase/auth'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../NavDesktop'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function CaixaPage() {
  const isDesktop = useIsDesktop()
  const { perfil } = useSessao()
  const [verHistorico, setVerHistorico] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [caixa, setCaixa] = useState<CaixaSessao | null>(null)
  const [movimentos, setMovimentos] = useState<CaixaMovimento[]>([])
  const [totais, setTotais] = useState<Record<string, number>>({})
  const [erro, setErro] = useState<string | null>(null)

  // abrir caixa
  const [valorInicial, setValorInicial] = useState('')
  const [abrindo, setAbrindo] = useState(false)

  // movimento
  const [mostrarMovimento, setMostrarMovimento] = useState<'reforco' | 'sangria' | null>(null)
  const [valorMovimento, setValorMovimento] = useState('')
  const [motivoMovimento, setMotivoMovimento] = useState('')
  const [salvandoMovimento, setSalvandoMovimento] = useState(false)

  // fechar caixa
  const [mostrarFechamento, setMostrarFechamento] = useState(false)
  const [corrigindoInicial, setCorrigindoInicial] = useState(false)
  const [novoInicial, setNovoInicial] = useState('')
  const [motivoCorrecao, setMotivoCorrecao] = useState('')
  const [salvandoCorrecao, setSalvandoCorrecao] = useState(false)
  const [valorContado, setValorContado] = useState('')
  const [observacaoFechamento, setObservacaoFechamento] = useState('')
  const [fechando, setFechando] = useState(false)
  const [resultadoFechamento, setResultadoFechamento] = useState<{ valor_esperado: number; divergencia: number } | null>(null)

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const sessao = await buscarCaixaAberto()
      setCaixa(sessao)
      if (sessao) {
        const [movs, tot] = await Promise.all([listarMovimentosCaixa(sessao.id), totaisPorFormaDoCaixa(sessao.id)])
        setMovimentos(movs)
        setTotais(tot)
      }
    } catch (e) {
      setErro('Não foi possível carregar o caixa.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function handleAbrirCaixa(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setAbrindo(true)
    try {
      await abrirCaixa(parseFloat(valorInicial || '0'))
      setValorInicial('')
      await carregar()
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir o caixa.')
    } finally {
      setAbrindo(false)
    }
  }

  async function handleSalvarMovimento(e: React.FormEvent) {
    e.preventDefault()
    if (!caixa || !mostrarMovimento) return
    setErro(null)
    setSalvandoMovimento(true)
    try {
      await registrarMovimentoCaixa(caixa.id, mostrarMovimento, parseFloat(valorMovimento || '0'), motivoMovimento.trim())
      setMostrarMovimento(null)
      setValorMovimento('')
      setMotivoMovimento('')
      await carregar()
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível registrar.')
    } finally {
      setSalvandoMovimento(false)
    }
  }

  async function handleCorrigirInicial(e: React.FormEvent) {
    e.preventDefault()
    if (!caixa) return
    const valor = parseFloat(novoInicial.replace(',', '.') || '0')
    if (isNaN(valor) || valor < 0) {
      setErro('Digite um valor válido.')
      return
    }
    setSalvandoCorrecao(true)
    setErro(null)
    try {
      await corrigirValorInicialCaixa(caixa.id, valor, motivoCorrecao.trim())
      setCorrigindoInicial(false)
      setMotivoCorrecao('')
      await carregar()
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível corrigir o valor.')
    } finally {
      setSalvandoCorrecao(false)
    }
  }

  async function handleFecharCaixa(e: React.FormEvent) {
    e.preventDefault()
    if (!caixa) return
    setErro(null)
    setFechando(true)
    try {
      const resultado = await fecharCaixa(caixa.id, parseFloat(valorContado || '0'), observacaoFechamento.trim() || undefined)
      setResultadoFechamento(resultado)
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível fechar o caixa.')
    } finally {
      setFechando(false)
    }
  }

  function finalizarTelaFechamento() {
    setMostrarFechamento(false)
    setResultadoFechamento(null)
    setValorContado('')
    setObservacaoFechamento('')
    carregar()
  }

  const totalReforcos = movimentos.filter((m) => m.tipo === 'reforco').reduce((s, m) => s + Number(m.valor), 0)
  const totalSangrias = movimentos.filter((m) => m.tipo === 'sangria').reduce((s, m) => s + Number(m.valor), 0)
  const totalDinheiroVendas = totais['dinheiro'] ?? 0
  const saldoEsperado = caixa ? Number(caixa.valor_inicial) + totalDinheiroVendas + totalReforcos - totalSangrias : 0

  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>

  // O histórico vive dentro da própria tela de Caixa, sem virar outra aba
  if (verHistorico) {
    return (
      <>
      {isDesktop && <NavDesktop />}
      <div className="container col-media" style={{ maxWidth: 560, paddingBottom: 80 }}>
        <HistoricoCaixa aoVoltar={() => setVerHistorico(false)} />
      </div>
      </>
    )
  }

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-media" style={{ maxWidth: 460, paddingBottom: 80 }}>
      <Link href="/" className="back-link desktop-oculto">← Voltar</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500 }}>Caixa</h1>
        {podeVerDinheiroDoNegocio(perfil?.role) && (
          <button onClick={() => setVerHistorico(true)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Histórico
          </button>
        )}
      </div>

      {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}

      {!caixa && (
        <div className="card">
          <p style={{ fontSize: 14, marginBottom: 14 }}>Nenhum caixa aberto no momento.</p>
          <form onSubmit={handleAbrirCaixa}>
            <label className="label">Valor inicial na gaveta</label>
            <input type="number" step="0.01" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)} placeholder="0,00" className="input" style={{ marginBottom: 12 }} />
            <button type="submit" disabled={abrindo} className="btn-primary" style={{ width: '100%', padding: 12 }}>
              {abrindo ? 'Abrindo...' : 'Abrir caixa'}
            </button>
          </form>
        </div>
      )}

      {caixa && !mostrarFechamento && (
        <>
          <div className="card card-accent" style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Saldo esperado em dinheiro</div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 500, marginTop: 6, color: 'var(--cyan)' }}>{reais(saldoEsperado)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
              Inicial {reais(Number(caixa.valor_inicial))} · Vendas dinheiro {reais(totalDinheiroVendas)} · Reforços {reais(totalReforcos)} · Sangrias {reais(totalSangrias)}
            </div>

            {!corrigindoInicial ? (
              <button
                onClick={() => { setCorrigindoInicial(true); setNovoInicial(String(caixa.valor_inicial)) }}
                style={{
                  border: 'none', background: 'none', color: 'var(--cyan)', fontSize: 11.5,
                  cursor: 'pointer', padding: 0, marginTop: 10, textDecoration: 'underline',
                }}
              >
                corrigir o valor de abertura
              </button>
            ) : (
              <form onSubmit={handleCorrigirInicial} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
                  Use quando o valor de abertura foi digitado errado. Isso não movimenta dinheiro —
                  só conserta a informação. Fica registrado no histórico.
                </p>
                <label className="label">Valor correto de abertura</label>
                <input
                  type="number" step="0.01" min="0"
                  value={novoInicial}
                  onChange={(e) => setNovoInicial(e.target.value)}
                  className="input"
                  style={{ marginBottom: 10 }}
                  autoFocus
                />
                <label className="label">Motivo (opcional)</label>
                <input
                  value={motivoCorrecao}
                  onChange={(e) => setMotivoCorrecao(e.target.value)}
                  placeholder="Ex: digitei 1600 mas era 4000"
                  className="input"
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setCorrigindoInicial(false)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancelar</button>
                  <button type="submit" disabled={salvandoCorrecao} className="btn-primary" style={{ flex: 1, padding: 10 }}>
                    {salvandoCorrecao ? 'Salvando...' : 'Corrigir'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {Object.keys(totais).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p className="section-title">Vendas confirmadas hoje neste caixa</p>
              {Object.entries(totais).map(([forma, valor]) => (
                <div key={forma} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                  <span>{FORMA_PAGAMENTO_LABEL[forma] ?? forma}</span>
                  <span className="mono">{reais(valor)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setMostrarMovimento('reforco')} className="btn-secondary" style={{ flex: 1, padding: 10, fontSize: 13 }}>+ Reforço</button>
            <button onClick={() => setMostrarMovimento('sangria')} className="btn-secondary" style={{ flex: 1, padding: 10, fontSize: 13 }}>− Sangria</button>
          </div>

          {movimentos.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p className="section-title">Movimentos do turno</p>
              {movimentos.map((m) => (
                <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: 10 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{m.tipo === 'reforco' ? 'Reforço' : 'Sangria'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.motivo}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: m.tipo === 'reforco' ? 'var(--green)' : 'var(--red)' }}>
                    {m.tipo === 'reforco' ? '+' : '−'}{reais(Number(m.valor))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setMostrarFechamento(true)} className="btn-danger" style={{ width: '100%' }}>Fechar caixa</button>
        </>
      )}

      {mostrarMovimento && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>{mostrarMovimento === 'reforco' ? 'Reforço de caixa' : 'Sangria'}</h2>
            <form onSubmit={handleSalvarMovimento}>
              <label className="label">Valor</label>
              <input type="number" step="0.01" value={valorMovimento} onChange={(e) => setValorMovimento(e.target.value)} placeholder="0,00" className="input" style={{ marginBottom: 12 }} />
              <label className="label">Motivo</label>
              <input value={motivoMovimento} onChange={(e) => setMotivoMovimento(e.target.value)} placeholder="Ex: troco extra, guardar dinheiro em local seguro..." className="input" style={{ marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setMostrarMovimento(null)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancelar</button>
                <button type="submit" disabled={salvandoMovimento} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                  {salvandoMovimento ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarFechamento && caixa && (
        <div className="card">
          {!resultadoFechamento ? (
            <form onSubmit={handleFecharCaixa}>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Fechar caixa</h2>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>Saldo esperado em dinheiro: <span className="mono" style={{ color: 'var(--cyan)' }}>{reais(saldoEsperado)}</span></p>
              <label className="label">Valor contado na gaveta</label>
              <input type="number" step="0.01" value={valorContado} onChange={(e) => setValorContado(e.target.value)} placeholder="0,00" className="input" style={{ marginBottom: 12 }} />
              <label className="label">Observação (opcional)</label>
              <input value={observacaoFechamento} onChange={(e) => setObservacaoFechamento(e.target.value)} placeholder="Ex: sobrou 5 reais, não sei o motivo" className="input" style={{ marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setMostrarFechamento(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Voltar</button>
                <button type="submit" disabled={fechando} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                  {fechando ? 'Fechando...' : 'Confirmar fechamento'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>Caixa fechado</h2>
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Esperado</p>
              <p className="mono" style={{ fontSize: 18, marginBottom: 10 }}>{reais(resultadoFechamento.valor_esperado)}</p>
              <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Diferença</p>
              <p className="mono" style={{ fontSize: 18, marginBottom: 20, color: Math.abs(resultadoFechamento.divergencia) < 0.01 ? 'var(--green)' : 'var(--amber)' }}>
                {resultadoFechamento.divergencia >= 0 ? '+' : ''}{reais(resultadoFechamento.divergencia)}
              </p>
              <button onClick={finalizarTelaFechamento} className="btn-primary" style={{ width: '100%' }}>Ok</button>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}
