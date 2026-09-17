'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Produto, listarProdutos } from '@/lib/supabase/produtos'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    listarProdutos().then(setProdutos).catch(() => setErro('Não foi possível carregar os produtos.')).finally(() => setCarregando(false))
  }, [])

  return (
    <div className="container">
      <Link href="/" className="back-link">← Voltar</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Produtos</h1>
        <Link href="/produtos/novo" className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>+ Novo produto</Link>
      </div>

      {carregando && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Carregando...</p>}
      {erro && <p className="error-text">{erro}</p>}
      {!carregando && !erro && produtos.length === 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Nenhum produto cadastrado ainda. Clique em "Novo produto" para começar.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {produtos.map((p) => (
          <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{p.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {p.categorias?.nome ?? 'Sem categoria'} · Estoque: {p.estoque_atual}
                {p.estoque_atual <= p.estoque_minimo && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>· baixo</span>}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--cyan)' }}>{reais(p.preco_venda)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
