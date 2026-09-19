import { createClient } from './client'

export type Produto = {
  id: string
  nome: string
  categoria_id: string | null
  preco_custo: number
  preco_venda: number
  estoque_atual: number
  estoque_minimo: number
  codigo_barras: string | null
  categorias?: { nome: string } | null
}

export async function listarProdutos(): Promise<Produto[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras, categorias(nome)')
    .order('nome', { ascending: true })

  if (error) throw error
  return (data as any) ?? []
}

export async function buscarProdutoPorCodigoBarras(codigo: string): Promise<Produto | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras, categorias(nome)')
    .eq('codigo_barras', codigo)
    .maybeSingle()

  if (error) throw error
  return (data as any) ?? null
}

export async function criarProduto(input: {
  nome: string
  categoria_id: string
  preco_custo: number
  preco_venda: number
  estoque_atual: number
  estoque_minimo: number
  codigo_barras?: string | null
}): Promise<Produto> {
  const supabase = createClient()

  // 1. Cria o produto
  const { data: produto, error: erroProduto } = await supabase
    .from('produtos')
    .insert({
      nome: input.nome,
      categoria_id: input.categoria_id,
      preco_custo: input.preco_custo,
      preco_venda: input.preco_venda,
      estoque_atual: input.estoque_atual,
      estoque_minimo: input.estoque_minimo,
      codigo_barras: input.codigo_barras || null,
    })
    .select('id, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras')
    .single()

  if (erroProduto) {
    if ((erroProduto as any).code === '23505') {
      throw new Error('Já existe um produto cadastrado com esse código de barras.')
    }
    throw erroProduto
  }

  // 2. Se já cadastrou com quantidade, registra a entrada no histórico de movimentações
  if (input.estoque_atual > 0) {
    const { error: erroMovimento } = await supabase.from('movimentacoes_estoque').insert({
      produto_id: produto.id,
      tipo: 'entrada',
      quantidade: input.estoque_atual,
    })
    if (erroMovimento) throw erroMovimento
  }

  return produto
}
