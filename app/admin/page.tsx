'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buscarMeuPerfil, listarEmpresas, definirEmpresaAtiva, Empresa } from '@/lib/supabase/auth'

// Área do administrador (Modernize): lista as empresas e deixa entrar em
// qualquer uma pra dar suporte, sem precisar da senha do cliente.
export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const perfil = await buscarMeuPerfil()
      if (!perfil) { router.replace('/login'); return }
      if (perfil.role !== 'admin') { router.replace('/'); return }
      try {
        setEmpresas(await listarEmpresas())
      } catch {
        setErro('Não foi possível carregar as empresas.')
      } finally {
        setCarregando(false)
      }
    })()
  }, [router])

  function acessar(empresaId: string) {
    definirEmpresaAtiva(empresaId)
    router.push('/')
  }

  async function sair() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (carregando) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 80, color: 'var(--text-dim)' }}>Carregando...</p>
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Modernize <span style={{ color: 'var(--cyan)' }}>Admin</span></h1>
        <button onClick={sair} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>Sair</button>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 22 }}>
        Escolha uma empresa pra acessar o sistema dela.
      </p>

      {erro && <p className="error-text">{erro}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {empresas.map((e) => (
          <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{e.nome}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>empresa</div>
            </div>
            <button onClick={() => acessar(e.id)} className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
              Acessar
            </button>
          </div>
        ))}
        {empresas.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Nenhuma empresa cadastrada.</p>}
      </div>
    </div>
  )
}
