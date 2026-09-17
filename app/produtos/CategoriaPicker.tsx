'use client'

import { useState } from 'react'
import { Categoria, criarCategoria } from '@/lib/supabase/categorias'

type Props = {
  categorias: Categoria[]
  categoriaId: string | null
  onChange: (categoriaId: string) => void
  onNovaCategoria: (categoria: Categoria) => void
}

export default function CategoriaPicker({ categorias, categoriaId, onChange, onNovaCategoria }: Props) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)

  const categoriaAtual = categorias.find((c) => c.id === categoriaId)
  const filtradas = categorias.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
  const buscaNaoExiste = busca.trim().length > 0 && !categorias.some((c) => c.nome.toLowerCase() === busca.trim().toLowerCase())

  async function handleCriarCategoria() {
    setCriando(true)
    try {
      const nova = await criarCategoria(busca.trim())
      onNovaCategoria(nova)
      onChange(nova.id)
      setAberto(false)
      setBusca('')
    } catch (e) {
      alert('Não foi possível criar a categoria. Tente novamente.')
    } finally {
      setCriando(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setAberto(!aberto)} className="input" style={{ textAlign: 'left', cursor: 'pointer' }}>
        {categoriaAtual ? categoriaAtual.nome : 'Selecione uma categoria'}
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 10, background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 10, padding: 10, maxHeight: 260, overflowY: 'auto' }}>
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar categoria" className="input" style={{ marginBottom: 8 }} />

          {filtradas.map((c) => (
            <div key={c.id} onClick={() => { onChange(c.id); setAberto(false); setBusca('') }} style={{ padding: '8px 6px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}>
              {c.nome}
            </div>
          ))}

          {filtradas.length === 0 && !buscaNaoExiste && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: '8px 6px' }}>Nenhuma categoria encontrada.</p>
          )}

          {buscaNaoExiste && (
            <div onClick={handleCriarCategoria} style={{ padding: '8px 6px', cursor: 'pointer', borderTop: '1px solid var(--line)', marginTop: 4, color: 'var(--cyan)', fontWeight: 500, fontSize: 13 }}>
              {criando ? 'Criando...' : `+ Criar categoria "${busca.trim()}"`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
