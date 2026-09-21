'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buscarMeuPerfil } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)

    if (error) {
      setErro(`Erro: ${error.message}`)
      return
    }

    // Admin vai pra área de empresas; lojista vai direto pro sistema.
    const perfil = await buscarMeuPerfil()
    if (perfil?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Entrar</h1>

        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seuemail@exemplo.com"
            className="input"
          />
        </div>

        <div>
          <label className="label">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="input"
          />
        </div>

        {erro && <p className="error-text">{erro}</p>}

        <button type="submit" disabled={carregando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
