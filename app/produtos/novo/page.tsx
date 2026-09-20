'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Categoria, listarCategorias } from '@/lib/supabase/categorias'
import { criarProduto } from '@/lib/supabase/produtos'
import { useLeitorCodigoBarras } from '@/lib/useLeitorCodigoBarras'
import CategoriaPicker from '../CategoriaPicker'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../../NavDesktop'

// useSearchParams precisa estar dentro de um Suspense (exigência do Next.js)
export default function NovoProdutoPage() {
  return (
    <Suspense fallback={<p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>}>
      <NovoProdutoConteudo />
    </Suspense>
  )
}

function NovoProdutoConteudo() {
  const isDesktop = useIsDesktop()
  const router = useRouter()
  const searchParams = useSearchParams()
  const codigoBarrasInicial = searchParams.get('codigo_barras') ?? ''

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [codigoBarras, setCodigoBarras] = useState(codigoBarrasInicial)
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueAtual, setEstoqueAtual] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCosmos, setBuscandoCosmos] = useState(false)
  const [sugestaoCosmos, setSugestaoCosmos] = useState<string | null>(null)

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => setErro('Não foi possível carregar as categorias.'))
  }, [])

  async function buscarNoCosmos(codigo: string) {
    if (!codigo) return
    setBuscandoCosmos(true)
    setSugestaoCosmos(null)
    try {
      const resp = await fetch(`/api/produtos/buscar-codigo-barras?codigo=${encodeURIComponent(codigo)}`)
      const dados = await resp.json()
      if (dados.encontrado && dados.nome) {
        setNome(dados.nome)
        setSugestaoCosmos(dados.marca ? `Preenchido automaticamente (${dados.marca})` : 'Preenchido automaticamente')
      }
    } catch (e) {
      // sem problema — segue o cadastro manual
    } finally {
      setBuscandoCosmos(false)
    }
  }

  // Se a tela já abriu com um código de barras (veio da tela de venda), busca na hora
  useEffect(() => {
    if (codigoBarrasInicial) buscarNoCosmos(codigoBarrasInicial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escaneando o leitor enquanto essa tela está aberta, preenche o campo de código de barras
  useLeitorCodigoBarras((codigo) => {
    setCodigoBarras(codigo)
    buscarNoCosmos(codigo)
  })

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
        codigo_barras: codigoBarras.trim() || null,
      })
      router.push('/produtos')
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar o produto. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-estreita" style={{ maxWidth: 420 }}>
      <Link href="/produtos" className="back-link desktop-oculto">← Voltar</Link>
      <h1 className="titulo-pagina" style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>Novo produto</h1>

      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Código de barras (opcional)</label>
          <input
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            onBlur={() => buscarNoCosmos(codigoBarras.trim())}
            placeholder="Escaneie ou digite o código"
            className="input"
          />
          {buscandoCosmos && <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>Procurando esse produto...</p>}
          {sugestaoCosmos && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 6 }}>✓ {sugestaoCosmos}</p>}
        </div>

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
    </>
  )
}
