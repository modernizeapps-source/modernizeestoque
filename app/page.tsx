'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { lerEmpresaAtiva, limparEmpresaAtiva, podeVerDinheiroDoNegocio } from '@/lib/supabase/auth'
import { useSessao } from './SessaoProvider'
import TrocarUsuario from './TrocarUsuario'
import { useT } from '@/lib/i18n'
import { buscarResumoHoje, ResumoHoje, buscarPainelDesktop, PainelDesktop } from '@/lib/supabase/dashboard'
import { buscarCaixaAberto } from '@/lib/supabase/caixa'
import { FORMA_PAGAMENTO_LABEL } from '@/lib/supabase/historico'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from './NavDesktop'
import PainelInicioDesktop from './PainelInicioDesktop'
import PainelFuncionario from './PainelFuncionario'
import SeletorIdioma from './SeletorIdioma'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function HomePage() {
  const isDesktop = useIsDesktop()
  const router = useRouter()
  const supabase = createClient()
  const { perfil, carregando: carregandoPerfil } = useSessao()
  const t = useT()
  const [mostrarTroca, setMostrarTroca] = useState(false)

  const ehAdmin = perfil?.role === 'admin'
  const vePainelCompleto = podeVerDinheiroDoNegocio(perfil?.role)
  const [carregando, setCarregando] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [resumo, setResumo] = useState<ResumoHoje | null>(null)
  const [carregandoResumo, setCarregandoResumo] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null)
  const [painel, setPainel] = useState<PainelDesktop | null>(null)

  useEffect(() => {
    if (carregandoPerfil) return

    (async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.replace('/login'); return }

      // Admin que ainda não escolheu empresa vai pra área administrativa
      if (perfil?.role === 'admin' && !lerEmpresaAtiva()) {
        router.replace('/admin')
        return
      }

      setEmail(auth.user.email ?? null)
      setCarregando(false)

      buscarCaixaAberto().then((c) => setCaixaAberto(!!c)).catch(() => setCaixaAberto(null))

      // Funcionário não vê faturamento nem lucro do negócio
      if (podeVerDinheiroDoNegocio(perfil?.role)) {
        setCarregandoResumo(true)
        buscarResumoHoje().then(setResumo).finally(() => setCarregandoResumo(false))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoPerfil, perfil?.role, router])

  // Os dados extras do painel só são buscados no computador — assim o
  // carregamento no celular continua exatamente igual ao de antes.
  useEffect(() => {
    if (!isDesktop || !email || !vePainelCompleto) return
    buscarPainelDesktop().then(setPainel).catch(() => setPainel(null))
  }, [isDesktop, email, vePainelCompleto])

  async function handleSair() {
    limparEmpresaAtiva()
    await supabase.auth.signOut()
    setEmail(null)
    setResumo(null)
    router.replace('/login')
  }

  // Admin volta pra lista de empresas
  function trocarEmpresa() {
    limparEmpresaAtiva()
    router.push('/admin')
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

  if (isDesktop) {
    return (
      <>
        {ehAdmin && (
          <div style={{
            position: 'relative', zIndex: 3, background: 'rgba(79,216,255,0.08)',
            borderBottom: '1px solid var(--line)', padding: '7px 32px',
            fontSize: 12, color: 'var(--cyan)', display: 'flex', justifyContent: 'center',
            gap: 14, alignItems: 'center',
          }}>
            <span>Você está no modo administrador, vendo os dados do Mercadinho do Misa</span>
            <button onClick={trocarEmpresa} style={{ border: 'none', background: 'none', color: 'var(--cyan)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>
              trocar empresa
            </button>
          </div>
        )}
        <NavDesktop statusCaixa={caixaAberto ? 'caixa aberto' : undefined} onSair={handleSair} />
        {!vePainelCompleto ? (
          <PainelFuncionario caixaAberto={caixaAberto} nome={perfil?.nome ?? null} aoTrocar={() => setMostrarTroca(true)} />
        ) : resumo ? (
          <PainelInicioDesktop resumo={resumo} painel={painel} />
        ) : (
          <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>
            Carregando...
          </p>
        )}
        {mostrarTroca && <TrocarUsuario aoFechar={() => setMostrarTroca(false)} />}
      </>
    )
  }

  return (
    <>
    {mostrarTroca && <TrocarUsuario aoFechar={() => setMostrarTroca(false)} />}
    {ehAdmin && (
      <div style={{
        position: 'relative', zIndex: 3, background: 'rgba(79,216,255,0.08)',
        borderBottom: '1px solid var(--line)', padding: '8px 16px',
        fontSize: 11.5, color: 'var(--cyan)', textAlign: 'center',
      }}>
        Modo administrador ·{' '}
        <button onClick={trocarEmpresa} style={{ border: 'none', background: 'none', color: 'var(--cyan)', textDecoration: 'underline', cursor: 'pointer', fontSize: 11.5 }}>
          trocar empresa
        </button>
      </div>
    )}
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Estoque Mercadinho</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {perfil?.nome && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{perfil.nome}</span>
          )}
          <button onClick={handleSair} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>{t('sair')}</button>
        </div>
      </div>

      {!vePainelCompleto && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              {t('quemEstaOperando')}
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 3 }}>{perfil?.nome ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SeletorIdioma />
            <button onClick={() => setMostrarTroca(true)} className="btn-secondary" style={{ padding: '8px 13px', fontSize: 12.5, whiteSpace: 'nowrap' }}>
              {t('trocarUsuario')}
            </button>
          </div>
        </div>
      )}

      <Link href="/venda" className="btn-primary" style={{ width: '100%', padding: 15, fontSize: 15, justifyContent: 'center', marginBottom: 20 }}>
        + {t('novaVenda')}
      </Link>

      {carregandoResumo && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando resumo do dia...</p>}

      {resumo && (
        <>
          <p className="subtitle" style={{ marginBottom: 8 }}>Hoje</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
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
            <div className="card">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Vendas hoje</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{resumo.numVendas}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div className="card card-accent">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Lucro</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 6, color: 'var(--green)' }}>{reais(resumo.lucro)}</div>
            </div>
            <div className="card card-accent">
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total vendido</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 500, marginTop: 6, color: 'var(--cyan)' }}>{reais(resumo.totalVendido)}</div>
            </div>
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


      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
        <Link href="/caixa" className="btn-secondary">{t('caixa')} {caixaAberto ? '· ✓' : ''}</Link>
        <Link href="/produtos" className="btn-secondary">{t('produtos')}</Link>
        {vePainelCompleto && <Link href="/historico" className="btn-secondary">Histórico</Link>}
        {vePainelCompleto && <Link href="/relatorios" className="btn-secondary">Relatórios</Link>}
        {vePainelCompleto && <Link href="/equipe" className="btn-secondary">Funcionários</Link>}
        {vePainelCompleto && <Link href="/configuracoes" className="btn-secondary">Configurações</Link>}
      </div>
    </div>
    </>
  )
}
