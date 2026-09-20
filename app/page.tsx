'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { buscarResumoHoje, ResumoHoje } from '@/lib/supabase/dashboard'
import { buscarCaixaAberto } from '@/lib/supabase/caixa'
import { FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from './NavDesktop'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function HomePage() {
  const isDesktop = useIsDesktop()
  const supabase = createClient()
  const [carregando, setCarregando] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [resumo, setResumo] = useState<ResumoHoje | null>(null)
  const [carregandoResumo, setCarregandoResumo] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userEmail = data.user?.email ?? null
      setEmail(userEmail)
      setCarregando(false)
      if (userEmail) {
        setCarregandoResumo(true)
        buscarResumoHoje().then(setResumo).finally(() => setCarregandoResumo(false))
        buscarCaixaAberto().then((c) => setCaixaAberto(!!c)).catch(() => setCaixaAberto(null))
      }
    })
  }, [])

  async function handleSair() {
    await supabase.auth.signOut()
    setEmail(null)
    setResumo(null)
  }

  if (carregando) {
    return (
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>
      </div>
    )
  }

  if (!email) {
    return (
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Estoque Mercadinho</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Você ainda não está logado.</p>
        <Link href="/login" className="btn-primary">Ir para o login</Link>
      </div>
    )
  }

  return (
    <>
    {isDesktop && <NavDesktop statusCaixa={caixaAberto ? 'caixa aberto' : undefined} />}
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500 }}>
          {isDesktop ? 'Resumo de hoje' : 'Estoque Mercadinho'}
        </h1>
        <button onClick={handleSair} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Sair</button>
      </div>

      {carregandoResumo && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando resumo do dia...</p>}

      {resumo && (
        <>
          <p className="subtitle" style={{ marginBottom: 8 }}>Hoje</p>
          <div className="metricas-desktop" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="card card-accent">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total vendido</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 6, color: 'var(--cyan)' }}>{reais(resumo.totalVendido)}</div>
            </div>
            <div className="card card-accent">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lucro</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 6, color: 'var(--green)' }}>{reais(resumo.lucro)}</div>
            </div>
          </div>

          <div className="metricas-desktop" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vendas hoje</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{resumo.numVendas}</div>
            </div>
            <Link
              href="/produtos"
              className="card"
              style={{
                textDecoration: 'none', color: 'inherit', display: 'block',
                borderColor: resumo.produtosEstoqueBaixo > 0 ? 'rgba(255,180,84,0.4)' : undefined,
              }}
            >
              <div className="mono" style={{ fontSize: 10, textTransform: 'uppercase', color: resumo.produtosEstoqueBaixo > 0 ? 'var(--amber)' : 'var(--text-dim)' }}>Estoque baixo</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6, color: resumo.produtosEstoqueBaixo > 0 ? 'var(--amber)' : 'var(--text)' }}>{resumo.produtosEstoqueBaixo}</div>
            </Link>
          </div>

          {resumo.formasPagamento.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p className="section-title">Formas de pagamento hoje</p>
              {resumo.formasPagamento.map((f) => (
                <div key={f.forma} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, width: 60 }}>{FORMA_PAGAMENTO_LABEL[f.forma] ?? f.forma}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${f.percentual}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', width: 34, textAlign: 'right' }}>{f.percentual.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {caixaAberto === false && (
        <Link href="/caixa" className="card" style={{ display: 'block', marginBottom: 16, textDecoration: 'none', borderColor: 'rgba(255,180,84,0.4)' }}>
          <span style={{ color: 'var(--amber)', fontSize: 13 }}>⚠ Nenhum caixa aberto hoje — toque aqui pra abrir</span>
        </Link>
      )}

      {isDesktop ? (
        <Link href="/venda" className="btn-primary" style={{ padding: '14px 26px', fontSize: 15 }}>Nova venda</Link>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link href="/venda" className="btn-primary">Nova venda</Link>
          <Link href="/caixa" className="btn-secondary">Caixa {caixaAberto ? '· aberto' : ''}</Link>
          <Link href="/historico" className="btn-secondary">Histórico</Link>
          <Link href="/produtos" className="btn-secondary">Produtos</Link>
          <Link href="/relatorios" className="btn-secondary">Relatórios</Link>
          <Link href="/configuracoes" className="btn-secondary">Configurações</Link>
        </div>
      )}
    </div>
    </>
  )
}
