'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Categoria, listarCategorias, criarCategoria, renomearCategoria,
  excluirCategoria, contarProdutosDaCategoria, definirUnidadesPorFardo,
} from '@/lib/supabase/categorias'
import { primeiraMaiuscula } from '@/lib/supabase/produtos'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../NavDesktop'
import CheckConfirmacao from '../CheckConfirmacao'

export default function CategoriasPage() {
  const isDesktop = useIsDesktop()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [nova, setNova] = useState('')
  const [criando, setCriando] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editFardo, setEditFardo] = useState('')
  const [salvando, setSalvando] = useState(false)

  // exclusão: precisa saber pra onde vão os produtos
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [qtdProdutos, setQtdProdutos] = useState(0)
  const [destinoId, setDestinoId] = useState<string>('')

  async function carregar() {
    try {
      setCategorias(await listarCategorias())
    } catch {
      setErro('Não foi possível carregar as categorias.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function mostrar(msg: string) {
    setAviso(msg)
    setTimeout(() => setAviso(null), 3000)
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!nova.trim()) return
    setCriando(true)
    setErro(null)
    try {
      await criarCategoria(nova.trim())
      setNova('')
      await carregar()
      mostrar('Categoria criada!')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível criar.')
    } finally {
      setCriando(false)
    }
  }

  function comecarEdicao(c: Categoria) {
    setEditandoId(c.id)
    setEditNome(c.nome)
    setEditFardo(c.unidades_por_fardo ? String(c.unidades_por_fardo) : '')
    setExcluindoId(null)
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId || !editNome.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      await renomearCategoria(editandoId, editNome.trim())
      const fardo = parseInt(editFardo || '0', 10)
      await definirUnidadesPorFardo(editandoId, fardo > 0 ? fardo : null)
      setEditandoId(null)
      await carregar()
      mostrar('Categoria atualizada! Os produtos dela já aparecem com o nome novo.')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function comecarExclusao(c: Categoria) {
    setEditandoId(null)
    setErro(null)
    try {
      const qtd = await contarProdutosDaCategoria(c.id)
      setQtdProdutos(qtd)
      setDestinoId('')
      setExcluindoId(c.id)
    } catch {
      setErro('Não foi possível verificar os produtos dessa categoria.')
    }
  }

  async function handleExcluir() {
    if (!excluindoId) return
    setSalvando(true)
    setErro(null)
    try {
      await excluirCategoria(excluindoId, destinoId || null)
      setExcluindoId(null)
      await carregar()
      mostrar(
        qtdProdutos > 0 && destinoId
          ? 'Categoria excluída e produtos transferidos.'
          : qtdProdutos > 0
            ? 'Categoria excluída. Os produtos ficaram sem categoria.'
            : 'Categoria excluída.'
      )
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível excluir.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  }

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-media" style={{ maxWidth: 520, paddingBottom: 60 }}>
      <Link href="/produtos" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13, marginBottom: 14 }}>← Voltar pra Produtos</Link>
      <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Categorias</h1>
      <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.5 }}>
        Renomear uma categoria já muda o nome em todos os produtos dela.
      </p>

      {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}
      {aviso && (
        <div className="success-box" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
          <CheckConfirmacao />
          <span>{aviso}</span>
        </div>
      )}

      {/* Nova categoria */}
      <form onSubmit={handleCriar} style={{ display: 'flex', gap: 9, marginBottom: 22 }}>
        <input
          value={nova}
          onChange={(e) => setNova(primeiraMaiuscula(e.target.value))}
          placeholder="Nome da nova categoria"
          className="input"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={criando || !nova.trim()} className="btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
          {criando ? '...' : 'Criar'}
        </button>
      </form>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categorias.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
            Nenhuma categoria cadastrada.
          </p>
        )}

        {categorias.map((c) => (
          <div key={c.id} className="card">
            {editandoId === c.id ? (
              <form onSubmit={handleSalvarEdicao}>
                <label className="label">Nome</label>
                <input
                  value={editNome}
                  onChange={(e) => setEditNome(primeiraMaiuscula(e.target.value))}
                  className="input"
                  style={{ marginBottom: 12 }}
                  autoFocus
                />

                <label className="label">Unidades por fardo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFardo}
                    onChange={(e) => setEditFardo(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="—"
                    className="input"
                    style={{ width: 88, textAlign: 'right' }}
                  />
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>unidades</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
                  Preencha só se essa categoria for comprada em fardo (cerveja, refrigerante).
                  Assim o aviso de reposição vem como "1 fardo + 5 un" em vez de "29 un". Deixe
                  vazio pra mostrar sempre em unidades.
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setEditandoId(null)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancelar</button>
                  <button type="submit" disabled={salvando} className="btn-primary" style={{ flex: 1, padding: 10 }}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            ) : excluindoId === c.id ? (
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Excluir "{c.nome}"?</p>
                {qtdProdutos > 0 ? (
                  <>
                    <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.5 }}>
                      Essa categoria tem {qtdProdutos} {qtdProdutos === 1 ? 'produto' : 'produtos'}.
                      Os produtos não serão apagados — escolha pra onde eles vão:
                    </p>
                    <select
                      value={destinoId}
                      onChange={(e) => setDestinoId(e.target.value)}
                      className="input"
                      style={{ marginBottom: 14 }}
                    >
                      <option value="">Deixar sem categoria</option>
                      {categorias.filter((x) => x.id !== c.id).map((x) => (
                        <option key={x.id} value={x.id}>Mover para {x.nome}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14 }}>
                    Não tem nenhum produto nessa categoria.
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setExcluindoId(null)} className="btn-secondary" style={{ flex: 1, padding: 10 }}>Cancelar</button>
                  <button onClick={handleExcluir} disabled={salvando} className="btn-danger" style={{ flex: 1, padding: 10 }}>
                    {salvando ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.nome}</div>
                  {c.unidades_por_fardo ? (
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>
                      fardo de {c.unidades_por_fardo} un
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => comecarEdicao(c)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Editar</button>
                  <button
                    onClick={() => comecarExclusao(c)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 17, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                    aria-label={`Excluir ${c.nome}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  )
}
