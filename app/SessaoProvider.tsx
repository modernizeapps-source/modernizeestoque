'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buscarMeuPerfil, podeAbrir, Perfil } from '@/lib/supabase/auth'
import { IdiomaContext, Idioma } from '@/lib/i18n'

type Sessao = {
  perfil: Perfil | null
  carregando: boolean
  recarregar: () => Promise<void>
}

const SessaoContext = createContext<Sessao>({ perfil: null, carregando: true, recarregar: async () => {} })

export function useSessao() {
  return useContext(SessaoContext)
}

// Carrega o perfil de quem está logado uma vez só e deixa disponível pra todas
// as telas. Também barra quem tenta abrir uma tela que o papel dele não permite.
export default function SessaoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    try {
      const p = await buscarMeuPerfil()
      setPerfil(p)
    } catch {
      setPerfil(null)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  // Recarrega o perfil quando o usuário troca (login, logout, troca rápida)
  useEffect(() => {
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setCarregando(true)
      carregar()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Barreira de acesso: se o papel não pode abrir a tela, volta pro início.
  // A trava de verdade é esta, não o menu — esconder o botão não impede
  // ninguém de digitar o endereço na barra do navegador.
  useEffect(() => {
    if (carregando) return
    if (pathname === '/login' || pathname === '/criar-conta') return
    if (!perfil) return

    if (!perfil.ativo) {
      router.replace('/login?inativo=1')
      return
    }
    if (!podeAbrir(perfil.role, pathname)) {
      router.replace('/')
    }
  }, [carregando, perfil, pathname, router])

  const idioma: Idioma = (perfil?.idioma === 'es' ? 'es' : 'pt')

  return (
    <SessaoContext.Provider value={{ perfil, carregando, recarregar: carregar }}>
      <IdiomaContext.Provider value={idioma}>
        {children}
      </IdiomaContext.Provider>
    </SessaoContext.Provider>
  )
}
