'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { salvarIdioma } from '@/lib/supabase/auth'
import { useSessao } from './SessaoProvider'

// Só aparece pro funcionário. A escolha vale só pra conta dele — não muda o
// idioma de mais ninguém, e não traduz nomes de produtos nem categorias.
export default function SeletorIdioma() {
  const router = useRouter()
  const { perfil, recarregar } = useSessao()
  const [salvando, setSalvando] = useState(false)

  if (perfil?.role !== 'funcionario') return null

  async function escolher(idioma: 'pt' | 'es') {
    if (idioma === perfil?.idioma) return
    setSalvando(true)
    try {
      await salvarIdioma(idioma)
      await recarregar()
      router.refresh()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {(['pt', 'es'] as const).map((id) => (
        <button
          key={id}
          onClick={() => escolher(id)}
          disabled={salvando}
          style={{
            border: '1px solid ' + (perfil.idioma === id ? 'var(--line-strong)' : 'transparent'),
            background: perfil.idioma === id ? 'rgba(79,216,255,0.1)' : 'transparent',
            color: perfil.idioma === id ? 'var(--cyan)' : 'var(--text-dim)',
            borderRadius: 7, padding: '4px 9px', fontSize: 11,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {id === 'pt' ? 'Português' : 'Español'}
        </button>
      ))}
    </div>
  )
}
