'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSessao } from './SessaoProvider'
import { podeAbrir } from '@/lib/supabase/auth'
import { useT } from '@/lib/i18n'

// Barra de navegação fixa no rodapé, só no celular. Fica sempre visível
// durante a rolagem, então dá pra trocar de tela sem voltar ao topo.
const LINKS = [
  { href: '/', chave: 'inicio' as const, icone: '⌂' },
  { href: '/venda', chave: 'venda' as const, icone: '+' },
  { href: '/produtos', chave: 'produtos' as const, icone: '▤' },
  { href: '/caixa', chave: 'caixa' as const, icone: '▣' },
  { href: '/relatorios', chave: 'relatorios' as const, icone: '◈' },
]

export default function NavCelular() {
  const pathname = usePathname()
  const { perfil } = useSessao()
  const t = useT()

  if (pathname === '/login' || pathname === '/criar-conta') return null

  // Mesma ideia da barra do computador: sem perfil carregado ainda, mostra só
  // o básico em vez de sumir com a navegação inteira.
  const links = LINKS.filter((l) =>
    perfil ? podeAbrir(perfil.role, l.href) : ['/', '/venda', '/produtos', '/caixa'].includes(l.href)
  )

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
        display: 'flex',
        borderTop: '1px solid var(--line)',
        background: 'rgba(6,10,16,0.93)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {links.map((l) => {
        const ativo = l.href === '/'
          ? pathname === '/'
          : pathname === l.href || pathname.startsWith(l.href + '/')
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              flex: 1, textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '9px 2px 10px',
              color: ativo ? 'var(--cyan)' : 'var(--text-dim)',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{l.icone}</span>
            <span style={{ fontSize: 9.5, letterSpacing: '0.01em' }}>{t(l.chave)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
