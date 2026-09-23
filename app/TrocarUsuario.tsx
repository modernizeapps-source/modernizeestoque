'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Troca de turno sem atrapalhar: o funcionário que assume digita e-mail e senha
// dele. Fica visível na tela inicial, ao lado do nome de quem está operando.
export default function TrocarUsuario({ aoFechar }: { aoFechar: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setEntrando(true)
    try {
      // Sai de quem estava e entra o novo, na mesma tela
      await supabase.auth.signOut()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })
      if (error) throw error
      aoFechar()
      router.refresh()
    } catch (e: any) {
      setErro(
        (e?.message ?? '').includes('Invalid login')
          ? 'E-mail ou senha errados.'
          : 'Não foi possível entrar. Tente de novo.'
      )
      setEntrando(false)
    }
  }

  return (
    <div
      onClick={aoFechar}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleEntrar}
        style={{
          width: '100%', maxWidth: 340, background: 'var(--panel)',
          border: '1px solid var(--line-strong)', borderRadius: 14, padding: 22,
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: 5 }}>Quem está operando?</h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 18, lineHeight: 1.5 }}>
          Entre com sua conta pra que as vendas fiquem registradas no seu nome.
        </p>

        <label className="label">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          style={{ marginBottom: 12 }}
          autoFocus
        />

        <label className="label">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="input"
          style={{ marginBottom: 16 }}
        />

        {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 9 }}>
          <button type="button" onClick={aoFechar} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
            Cancelar
          </button>
          <button type="submit" disabled={entrando} className="btn-primary" style={{ flex: 1, padding: 12 }}>
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
