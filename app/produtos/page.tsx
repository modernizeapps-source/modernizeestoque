'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Produto, listarProdutos, margemLucro } from '@/lib/supabase/produtos'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../NavDesktop'
import { Categoria, listarCategorias } from '@/lib/supabase/categorias'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function ProdutosPage() {
  const isDesktop = useIsDesktop()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listarProdutos(), listarCategorias()])
      .then(([p, c]) => { setProdutos(p); setCategorias(c) })
      .catch(() => setErro('Não foi possível carregar os produtos.'))
      .finally(() => setCarregando(false))
  }, [])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const bateCategoria = !categoriaId || p.categoria_id === categoriaId
      const bateBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
      return bateCategoria && bateBusca
    })
  }, [produtos, categoriaId, busca])

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container">
      <Link href="/" className="back-link desktop-oculto">← Voltar</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500 }}>Produtos</h1>
        <Link href="/produtos/novo" className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>+ Novo produto</Link>
      </div>

      {!carregando && !erro && produtos.length > 0 && (
        <>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto"
            className="input"
            style={{ marginBottom: 12 }}
          />

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
            <button onClick={() => setCategoriaId(null)} className={`pill ${categoriaId === null ? 'pill-active' : ''}`}>Todas</button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaId(c.id)} className={`pill ${categoriaId === c.id ? 'pill-active' : ''}`}>{c.nome}</button>
            ))}
          </div>
        </>
      )}

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}
      {!carregando && !erro && produtos.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhum produto cadastrado ainda. Clique em "Novo produto" para começar.</p>
      )}
      {!carregando && !erro && produtos.length > 0 && produtosFiltrados.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhum produto encontrado com esse filtro.</p>
      )}

      <div className="grade-desktop-cards" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {produtosFiltrados.map((p) => {
          const margem = margemLucro(p.preco_venda, p.preco_custo)
          return (
            <Link
              key={p.id}
              href={`/produtos/${p.id}`}
              className="card card-clicavel"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'var(--text)' }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  {p.categorias?.nome ?? 'Sem categoria'} · Estoque: {p.estoque_atual}
                  {p.estoque_atual <= p.estoque_minimo && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>· baixo</span>}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                  custo {reais(p.preco_custo)} · margem <span style={{ color: margem > 0 ? 'var(--green)' : 'var(--red)' }}>{margem.toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--cyan)' }}>{reais(p.preco_venda)}</div>
                <span style={{ color: 'var(--text-dim)', fontSize: 16 }}>›</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
    </>
  )
}
