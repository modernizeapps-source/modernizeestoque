'use client'

import { useState } from 'react'
import { Categoria, criarCategoria } from '@/lib/supabase/categorias'
import { primeiraMaiuscula } from '@/lib/supabase/produtos'

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
  const [modoNova, setModoNova] = useState(false)
  const [nomeNova, setNomeNova] = useState('')

  const categoriaAtual = categorias.find((c) => c.id === categoriaId)
  const filtradas = categorias.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
  const buscaNaoExiste =
    busca.trim().length > 0 &&
    !categorias.some((c) => c.nome.toLowerCase() === busca.trim().toLowerCase())

  function fechar() {
    setAberto(false)
    setBusca('')
    setModoNova(false)
    setNomeNova('')
  }

  async function criar(nome: string) {
    const limpo = nome.trim()
    if (!limpo) return
    setCriando(true)
    try {
      const nova = await criarCategoria(limpo)
      onNovaCategoria(nova)
      onChange(nova.id)
      fechar()
    } catch (e) {
      alert('Não foi possível criar a categoria. Tente novamente.')
    } finally {
      setCriando(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        className="input"
        style={{ textAlign: 'left', cursor: 'pointer' }}
      >
        {categoriaAtual ? categoriaAtual.nome : 'Selecione uma categoria'}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 10,
          background: 'var(--panel)', border: '1px solid var(--line-strong)',
          borderRadius: 10, padding: 10, maxHeight: 280, overflowY: 'auto',
        }}>
          {modoNova ? (
            /* Criando uma categoria nova, sem sair da tela do produto */
            <div>
              <label className="label">Nome da nova categoria</label>
              <input
                autoFocus
                value={nomeNova}
                onChange={(e) => setNomeNova(primeiraMaiuscula(e.target.value))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); criar(nomeNova) } }}
                placeholder="Ex: Cerveja, Doce, Refrigerante"
                className="input"
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setModoNova(false); setNomeNova('') }}
                  className="btn-secondary"
                  style={{ flex: 1, padding: 9, fontSize: 12.5 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => criar(nomeNova)}
                  disabled={criando || !nomeNova.trim()}
                  className="btn-primary"
                  style={{ flex: 1, padding: 9, fontSize: 12.5 }}
                >
                  {criando ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar categoria"
                className="input"
                style={{ marginBottom: 8 }}
              />

              {/* Botão sempre visível, pra não precisar adivinhar que dá pra criar */}
              <button
                type="button"
                onClick={() => { setModoNova(true); setNomeNova(primeiraMaiuscula(busca.trim())) }}
                style={{
                  width: '100%', textAlign: 'left', border: '1px dashed var(--line-strong)',
                  background: 'rgba(79,216,255,0.05)', color: 'var(--cyan)',
                  borderRadius: 8, padding: '9px 10px', fontSize: 13, cursor: 'pointer',
                  marginBottom: 8, fontFamily: 'inherit',
                }}
              >
                + Adicionar categoria
              </button>

              {filtradas.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { onChange(c.id); fechar() }}
                  style={{ padding: '8px 6px', cursor: 'pointer', borderRadius: 6, fontSize: 13 }}
                >
                  {c.nome}
                </div>
              ))}

              {filtradas.length === 0 && !buscaNaoExiste && (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: '8px 6px' }}>
                  Nenhuma categoria encontrada.
                </p>
              )}

              {/* Atalho: digitou um nome que não existe, cria direto */}
              {buscaNaoExiste && (
                <div
                  onClick={() => criar(busca)}
                  style={{
                    padding: '8px 6px', cursor: 'pointer', borderTop: '1px solid var(--line)',
                    marginTop: 4, color: 'var(--cyan)', fontWeight: 500, fontSize: 13,
                  }}
                >
                  {criando ? 'Criando...' : `+ Criar "${busca.trim()}"`}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
