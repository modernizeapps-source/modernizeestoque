'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSessao } from './SessaoProvider'
import { podeAbrir } from '@/lib/supabase/auth'
import { useT } from '@/lib/i18n'

const LINKS = [
  { href: '/', chave: 'inicio' as const, nome: 'Início' },
  { href: '/venda', chave: 'venda' as const, nome: 'Venda' },
  { href: '/produtos', chave: 'produtos' as const, nome: 'Produtos' },
  { href: '/caixa', chave: 'caixa' as const, nome: 'Caixa' },
  { href: '/historico', chave: null, nome: 'Histórico' },
  { href: '/relatorios', chave: 'relatorios' as const, nome: 'Relatórios' },
  { href: '/equipe', chave: null, nome: 'Funcionários' },
  { href: '/configuracoes', chave: null, nome: 'Configurações' },
]

// Barra de navegação fixa no topo — só aparece no layout de computador.
// No celular, a navegação continua sendo pela tela inicial, como sempre foi.
export default function NavDesktop({ statusCaixa, onSair }: { statusCaixa?: string; onSair?: () => void }) {
  const pathname = usePathname()
  const { perfil, carregando } = useSessao()
  const t = useT()

  // Cada papel vê só as telas que pode abrir.
  // Enquanto o perfil não chega, mostra só o básico — assim ninguém fica com a
  // barra vazia, e nada de dono (relatórios, configurações, equipe) aparece
  // pra quem não deve ver.
  const links = LINKS.filter((l) =>
    perfil ? podeAbrir(perfil.role, l.href) : ['/', '/venda', '/produtos', '/caixa'].includes(l.href)
  )

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      borderBottom: '1px solid var(--line)',
      background: 'rgba(6,10,16,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      marginBottom: 26,
    }}>
      <div style={{
        maxWidth: 1360, margin: '0 auto', padding: '0 32px',
        height: 58, display: 'flex', alignItems: 'center', gap: 28,
      }}>
        <Link href="/" style={{
          textDecoration: 'none', color: 'var(--text)', fontSize: 14.5, fontWeight: 500,
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          Estoque <span style={{ color: 'var(--cyan)' }}>Mercadinho</span>
        </Link>

        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {links.map((l) => {
            const ativo = l.href === '/'
              ? pathname === '/'
              : pathname === l.href || pathname.startsWith(l.href + '/')
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  textDecoration: 'none',
                  fontSize: 13.5,
                  padding: '7px 13px',
                  borderRadius: 8,
                  color: ativo ? 'var(--cyan)' : 'var(--text-dim)',
                  background: ativo ? 'rgba(79,216,255,0.09)' : 'transparent',
                  transition: 'color .15s, background .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {l.chave ? t(l.chave) : l.nome}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {statusCaixa && (
            <div className="mono" style={{
              fontSize: 11.5, color: 'var(--green)',
              display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
              }} />
              {statusCaixa}
            </div>
          )}
          {perfil?.nome && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
              {perfil.nome}
            </span>
          )}
          {onSair && (
            <button
              onClick={onSair}
              style={{
                border: 'none', background: 'none', color: 'var(--text-dim)',
                fontSize: 12.5, cursor: 'pointer', padding: '4px 2px', fontFamily: 'inherit',
              }}
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
