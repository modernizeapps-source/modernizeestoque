'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Categoria, listarCategorias } from '@/lib/supabase/categorias'
import { criarProduto } from '@/lib/supabase/produtos'
import CategoriaPicker from '../CategoriaPicker'

export default function NovoProdutoPage() {
  const router = useRouter()

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueAtual, setEstoqueAtual] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => setErro('Não foi possível carregar as categorias.'))
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!nome.trim()) return setErro('Digite o nome do produto.')
    if (!categoriaId) return setErro('Selecione uma categoria.')
    if (!precoVenda) return setErro('Digite o preço de venda.')

    setSalvando(true)
    try {
      await criarProduto({
        nome: nome.trim(),
        categoria_id: categoriaId,
        preco_custo: parseFloat(precoCusto || '0'),
        preco_venda: parseFloat(precoVenda),
        estoque_atual: parseInt(estoqueAtual || '0', 10),
        estoque_minimo: parseInt(estoqueMinimo || '0', 10),
      })
      router.push('/produtos')
    } catch (e) {
      setErro('Não foi possível salvar o produto. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <Link href="/produtos" className="back-link">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>Novo produto</h1>

      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Nome do produto</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cerveja lata 350ml" className="input" />
        </div>

        <div>
          <label className="label">Categoria</label>
          <CategoriaPicker
            categorias={categorias}
            categoriaId={categoriaId}
            onChange={setCategoriaId}
            onNovaCategoria={(nova) => setCategorias((prev) => [...prev, nova])}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Preço de custo</label>
            <input type="number" step="0.01" value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="0,00" className="input" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Preço de venda</label>
            <input type="number" step="0.01" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="0,00" className="input" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Qtd. em estoque</label>
            <input type="number" value={estoqueAtual} onChange={(e) => setEstoqueAtual(e.target.value)} placeholder="0" className="input" />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Estoque mínimo</label>
            <input type="number" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} placeholder="0" className="input" />
          </div>
        </div>

        {erro && <p className="error-text">{erro}</p>}

        <button type="submit" disabled={salvando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {salvando ? 'Salvando...' : 'Salvar produto'}
        </button>
      </form>
    </div>
  )
}
