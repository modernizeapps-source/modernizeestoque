'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usarConvite } from '@/lib/supabase/auth'

function CriarContaConteudo() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const [codigo, setCodigo] = useState((params.get('codigo') ?? '').toUpperCase())
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (codigo.trim().length < 4) return setErro('Digite o código que te passaram.')
    if (!email.trim()) return setErro('Digite seu e-mail.')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== senha2) return setErro('As duas senhas não são iguais.')

    setCarregando(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha })
      if (error) throw error
      if (!data.user) throw new Error('Não foi possível criar a conta.')

      // Liga a conta nova ao convite: define o papel e a empresa
      await usarConvite(codigo, data.user.id)

      router.push('/')
    } catch (e: any) {
      const msg = e?.message ?? 'Não foi possível criar a conta.'
      setErro(
        msg.includes('already registered')
          ? 'Esse e-mail já tem conta. Use a tela de entrar.'
          : msg
      )
      setCarregando(false)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={handleCriar} style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Criar sua conta</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>
          Use o código que seu chefe te passou. Você escolhe sua própria senha —
          ninguém mais vai saber ela.
        </p>

        <label className="label">Código do convite</label>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Ex: K7P2M9"
          className="input mono"
          style={{ marginBottom: 14, letterSpacing: '0.18em', fontSize: 17, textAlign: 'center' }}
          maxLength={8}
        />

        <label className="label">Seu e-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="input"
          style={{ marginBottom: 14 }}
        />

        <label className="label">Crie uma senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Pelo menos 6 caracteres"
          className="input"
          style={{ marginBottom: 14 }}
        />

        <label className="label">Repita a senha</label>
        <input
          type="password"
          value={senha2}
          onChange={(e) => setSenha2(e.target.value)}
          className="input"
          style={{ marginBottom: 18 }}
        />

        {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}

        <button type="submit" disabled={carregando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {carregando ? 'Criando...' : 'Criar conta'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--text-dim)' }}>
          Já tem conta? <Link href="/login" style={{ color: 'var(--cyan)' }}>Entrar</Link>
        </p>
      </form>
    </div>
  )
}

export default function CriarContaPage() {
  return (
    <Suspense fallback={<p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 80, color: 'var(--text-dim)' }}>Carregando...</p>}>
      <CriarContaConteudo />
    </Suspense>
  )
}
