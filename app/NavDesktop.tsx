'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', nome: 'Início' },
  { href: '/venda', nome: 'Venda' },
  { href: '/produtos', nome: 'Produtos' },
  { href: '/caixa', nome: 'Caixa' },
  { href: '/historico', nome: 'Histórico' },
  { href: '/relatorios', nome: 'Relatórios' },
  { href: '/configuracoes', nome: 'Configurações' },
]

// Barra de navegação fixa no topo — só aparece no layout de computador.
// No celular, a navegação continua sendo pela tela inicial, como sempre foi.
export default function NavDesktop({ statusCaixa, onSair }: { statusCaixa?: string; onSair?: () => void }) {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'relative', zIndex: 2,
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
          {LINKS.map((l) => {
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
                {l.nome}
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
