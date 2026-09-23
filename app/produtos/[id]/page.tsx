'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Categoria, listarCategorias } from '@/lib/supabase/categorias'
import {
  Produto, buscarProduto, atualizarProduto, excluirProduto,
  registrarEntradaMercadoria, ajustarEstoque, margemLucro, primeiraMaiuscula,
} from '@/lib/supabase/produtos'
import { useLeitorCodigoBarras } from '@/lib/useLeitorCodigoBarras'
import CategoriaPicker from '../CategoriaPicker'
import { useIsDesktop } from '@/lib/useIsDesktop'
import NavDesktop from '../../NavDesktop'

function reais(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export default function EditarProdutoPage() {
  const isDesktop = useIsDesktop()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [produto, setProduto] = useState<Produto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // campos de edição
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [codigoBarras, setCodigoBarras] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')
  const [estoqueAtual, setEstoqueAtual] = useState('')
  const [motivoEstoque, setMotivoEstoque] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // entrada de mercadoria
  const [mostrarEntrada, setMostrarEntrada] = useState(false)
  const [qtdChegou, setQtdChegou] = useState('')
  const [custoChegou, setCustoChegou] = useState('')
  const [salvandoEntrada, setSalvandoEntrada] = useState(false)

  async function carregar() {
    try {
      const [p, cats] = await Promise.all([buscarProduto(id), listarCategorias()])
      if (!p) { setErro('Produto não encontrado.'); return }
      setProduto(p)
      setCategorias(cats)
      setNome(p.nome)
      setCategoriaId(p.categoria_id)
      setCodigoBarras(p.codigo_barras ?? '')
      setPrecoVenda(String(p.preco_venda))
      setEstoqueMinimo(String(p.estoque_minimo))
      setEstoqueAtual(String(p.estoque_atual))
      setMotivoEstoque('')
    } catch (e) {
      setErro('Não foi possível carregar o produto.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [id])

  useLeitorCodigoBarras((codigo) => setCodigoBarras(codigo), !mostrarEntrada)

  function avisar(msg: string) {
    setSucesso(msg)
    setTimeout(() => setSucesso(null), 3000)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!nome.trim()) return setErro('Digite o nome do produto.')
    if (!categoriaId) return setErro('Selecione uma categoria.')
    if (!precoVenda) return setErro('Digite o preço de venda.')

    // Mudar o número do estoque é corrigir uma contagem, então pede o motivo —
    // fica no histórico de movimentações, separado de "chegou mercadoria".
    const novoEstoque = parseInt(estoqueAtual || '0', 10)
    const estoqueMudou = produto != null && novoEstoque !== produto.estoque_atual
    if (estoqueMudou && !motivoEstoque.trim()) {
      return setErro('Diga o motivo da mudança de estoque (ex: contagem de prateleira, quebra).')
    }

    setSalvando(true)
    try {
      if (estoqueMudou) {
        await ajustarEstoque(id, novoEstoque, motivoEstoque.trim())
      }

      await atualizarProduto(id, {
        nome: nome.trim(),
        categoria_id: categoriaId,
        preco_venda: parseFloat(precoVenda.replace(',', '.')),
        preco_custo: produto!.preco_custo,
        estoque_minimo: parseInt(estoqueMinimo || '0', 10),
        codigo_barras: codigoBarras.trim() || null,
      })
      // Volta pra lista de Produtos levando a confirmação
      router.push('/produtos?salvo=' + encodeURIComponent(nome.trim()))
    } catch (e: any) {
      // Deu erro: fica na tela, com tudo que a pessoa digitou preservado
      setErro(e?.message ?? 'Não foi possível salvar. Confira os dados e tente de novo.')
      setSalvando(false)
    }
  }

  async function handleEntrada(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const qtd = parseInt(qtdChegou || '0', 10)
    const custo = parseFloat((custoChegou || '0').replace(',', '.'))
    if (qtd <= 0) return setErro('Quantas unidades chegaram?')
    if (custo < 0 || isNaN(custo)) return setErro('Quanto você pagou por unidade?')

    setSalvandoEntrada(true)
    try {
      const r = await registrarEntradaMercadoria(id, qtd, custo)
      setMostrarEntrada(false)
      setQtdChegou('')
      setCustoChegou('')
      await carregar()
      avisar(`Estoque agora: ${r.estoque_novo} · Custo médio: ${reais(r.custo_medio_novo)}`)
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível registrar a entrada.')
    } finally {
      setSalvandoEntrada(false)
    }
  }

  async function handleExcluir() {
    if (!produto) return
    const certeza = confirm(
      `Excluir "${produto.nome}" de vez?\n\nIsso não pode ser desfeito. ` +
      `Se o produto já foi vendido alguma vez, ele não poderá ser excluído — ` +
      `o histórico de vendas precisa dele.`
    )
    if (!certeza) return

    setExcluindo(true)
    setErro(null)
    try {
      await excluirProduto(id)
      router.push('/produtos?excluido=' + encodeURIComponent(produto.nome))
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível excluir.')
      setExcluindo(false)
    }
  }

  if (carregando) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60, color: 'var(--text-dim)' }}>Carregando...</p>
  if (!produto) return <p style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: 60 }} className="error-text">{erro}</p>

  const margem = margemLucro(produto.preco_venda, produto.preco_custo)

  // prévia do custo médio enquanto ele digita a entrada
  const qtdPrevia = parseInt(qtdChegou || '0', 10)
  const custoPrevia = parseFloat((custoChegou || '0').replace(',', '.'))
  const temPrevia = qtdPrevia > 0 && custoPrevia >= 0 && !isNaN(custoPrevia)
  const estoqueDepois = produto.estoque_atual + qtdPrevia
  const custoDepois = produto.estoque_atual <= 0
    ? custoPrevia
    : (produto.estoque_atual * produto.preco_custo + qtdPrevia * custoPrevia) / estoqueDepois

  return (
    <>
    {isDesktop && <NavDesktop />}
    <div className="container col-media" style={{ maxWidth: 460, paddingBottom: 60 }}>
      <Link href="/produtos" className="back-link desktop-oculto">← Voltar</Link>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16 }}>{produto.nome}</h1>

      {sucesso && <div className="success-box" style={{ marginBottom: 14 }}>✓ {sucesso}</div>}
      {erro && <p className="error-text" style={{ marginBottom: 12 }}>{erro}</p>}

      {/* Situação atual */}
      <div className="card card-accent" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Em estoque</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 4, color: produto.estoque_atual <= produto.estoque_minimo ? 'var(--amber)' : 'var(--cyan)' }}>
              {produto.estoque_atual}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Margem</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500, marginTop: 4, color: margem > 0 ? 'var(--green)' : 'var(--red)' }}>
              {margem.toFixed(0)}%
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <span>Compro por <span className="mono" style={{ color: 'var(--text)' }}>{reais(produto.preco_custo)}</span></span>
          <span>Vendo por <span className="mono" style={{ color: 'var(--cyan)' }}>{reais(produto.preco_venda)}</span></span>
        </div>
      </div>

      {/* Chegou mercadoria */}
      {!mostrarEntrada ? (
        <button onClick={() => setMostrarEntrada(true)} className="btn-primary" style={{ width: '100%', padding: 13, marginBottom: 20 }}>
          📦 Chegou mercadoria
        </button>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Chegou mercadoria</h2>
          <form onSubmit={handleEntrada}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="label">Quantas chegaram</label>
                <input type="number" min="1" value={qtdChegou} onChange={(e) => setQtdChegou(e.target.value)} placeholder="0" className="input" autoFocus />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Preço por unidade</label>
                <input type="number" step="0.01" min="0" value={custoChegou} onChange={(e) => setCustoChegou(e.target.value)} placeholder="0,00" className="input" />
              </div>
            </div>

            {temPrevia && (
              <div style={{ background: 'rgba(95,255,176,0.08)', border: '1px solid rgba(95,255,176,0.25)', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 12.5, lineHeight: 1.6 }}>
                Estoque: <span className="mono">{produto.estoque_atual} → {estoqueDepois}</span><br />
                Custo médio: <span className="mono">{reais(produto.preco_custo)} → <span style={{ color: 'var(--green)' }}>{reais(custoDepois)}</span></span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setMostrarEntrada(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancelar</button>
              <button type="submit" disabled={salvandoEntrada} className="btn-primary" style={{ flex: 2, padding: 12 }}>
                {salvandoEntrada ? 'Salvando...' : 'Confirmar entrada'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dados do produto */}
      <p className="section-title">Dados do produto</p>
      <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div>
          <label className="label">Nome</label>
          <input value={nome} onChange={(e) => setNome(primeiraMaiuscula(e.target.value))} className="input" />
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

        <div>
          <label className="label">Código de barras</label>
          <input value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Escaneie ou digite" className="input" />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Estoque atual</label>
            <input
              type="text"
              inputMode="numeric"
              value={estoqueAtual}
              onChange={(e) => setEstoqueAtual(e.target.value.replace(/[^0-9]/g, ''))}
              className="input"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Estoque mínimo</label>
            <input
              type="text"
              inputMode="numeric"
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(e.target.value.replace(/[^0-9]/g, ''))}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Preço de venda</label>
          <input type="number" step="0.01" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} className="input" />
        </div>

        {estoqueAtual !== '' && produto && parseInt(estoqueAtual, 10) !== produto.estoque_atual && (
          <div style={{
            background: 'rgba(255,180,84,0.08)', border: '1px solid rgba(255,180,84,0.25)',
            borderRadius: 10, padding: '10px 13px', fontSize: 12, color: 'var(--amber)', lineHeight: 1.5,
          }}>
            O estoque vai de <span className="mono">{produto.estoque_atual}</span> para{' '}
            <span className="mono">{estoqueAtual}</span> ao salvar. Isso é uma correção de contagem —
            pra mercadoria que chegou, use "Chegou mercadoria" acima, que recalcula o custo.
          </div>
        )}

        {estoqueAtual !== '' && produto && parseInt(estoqueAtual, 10) !== produto.estoque_atual && (
          <div>
            <label className="label">Por que o estoque mudou?</label>
            <input
              value={motivoEstoque}
              onChange={(e) => setMotivoEstoque(e.target.value)}
              placeholder="Ex: contagem de prateleira, quebra, perda"
              className="input"
            />
          </div>
        )}

        <button type="submit" disabled={salvando} className="btn-primary" style={{ width: '100%', padding: 13 }}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {/* Excluir produto */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 18, marginTop: 4 }}>
        <button
          onClick={handleExcluir}
          disabled={excluindo}
          className="btn-danger"
          style={{ width: '100%', padding: 12, fontSize: 13.5 }}
        >
          {excluindo ? 'Excluindo...' : 'Excluir produto'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 9, lineHeight: 1.5, textAlign: 'center' }}>
          Produtos que já foram vendidos não podem ser excluídos, pra não quebrar o histórico.
        </p>
      </div>

    </div>
    </>
  )
}
