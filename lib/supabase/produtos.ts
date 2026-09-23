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

export async function buscarProduto(id: string): Promise<Produto | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, categoria_id, preco_custo, preco_venda, estoque_atual, estoque_minimo, codigo_barras, categorias(nome)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as any) ?? null
}

export async function atualizarProduto(id: string, input: {
  nome: string
  categoria_id: string
  preco_venda: number
  preco_custo: number
  estoque_minimo: number
  codigo_barras?: string | null
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('produtos')
    .update({
      nome: input.nome,
      categoria_id: input.categoria_id,
      preco_venda: input.preco_venda,
      preco_custo: input.preco_custo,
      estoque_minimo: input.estoque_minimo,
      codigo_barras: input.codigo_barras || null,
    })
    .eq('id', id)

  if (error) {
    if ((error as any).code === '23505') {
      throw new Error('Já existe outro produto com esse código de barras.')
    }
    throw error
  }
}

// Entrada de mercadoria: soma ao estoque e recalcula o custo médio ponderado.
// Ex: 20 unidades a R$3,00 + 50 a R$2,50 => 70 unidades a R$2,64.
export async function registrarEntradaMercadoria(
  produtoId: string,
  quantidade: number,
  custoUnitario: number
): Promise<{ estoque_novo: number; custo_medio_novo: number }> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('registrar_entrada_mercadoria', {
    p_produto_id: produtoId,
    p_quantidade: quantidade,
    p_custo_unitario: custoUnitario,
  })
  if (error) throw error
  const row = (data as any[])[0]
  return { estoque_novo: row.estoque_novo, custo_medio_novo: Number(row.custo_medio_novo) }
}

// Correção manual do estoque (quando a contagem da prateleira não bate)
export async function ajustarEstoque(produtoId: string, estoqueNovo: number, motivo: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('ajustar_estoque', {
    p_produto_id: produtoId,
    p_estoque_novo: estoqueNovo,
    p_motivo: motivo,
  })
  if (error) throw error
}

// Calcula quanto sobra de cada venda, em % sobre o preço de venda
export function margemLucro(precoVenda: number, precoCusto: number): number {
  if (!precoVenda || precoVenda <= 0) return 0
  return ((precoVenda - precoCusto) / precoVenda) * 100
}

// Deixa a primeira letra maiúscula sem mexer no resto do que a pessoa digitou.
// Útil pra quem digita rápido no balcão e não quer se preocupar com o Shift.
export function primeiraMaiuscula(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export async function excluirProduto(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) {
    // Produto já usado em vendas não pode sumir, senão o histórico quebra
    if ((error as any).code === '23503') {
      throw new Error('Esse produto já foi vendido, então não pode ser excluído — o histórico de vendas precisa dele. Você pode zerar o estoque dele.')
    }
    throw error
  }
}

// Quanto falta pra chegar no estoque mínimo, escrito do jeito que o lojista
// compra: em fardos quando a categoria é vendida assim, em unidades quando não.
// Ex: faltam 29 latas e o fardo tem 24 → "1 fardo + 5 un".
export function textoReposicao(
  estoqueAtual: number,
  estoqueMinimo: number,
  unidadesPorFardo?: number | null
): string {
  const falta = Math.max(0, estoqueMinimo - estoqueAtual)
  if (falta === 0) return ''

  if (unidadesPorFardo && unidadesPorFardo > 0) {
    const fardos = Math.floor(falta / unidadesPorFardo)
    const avulsas = falta % unidadesPorFardo
    const partes: string[] = []
    if (fardos > 0) partes.push(`${fardos} ${fardos === 1 ? 'fardo' : 'fardos'}`)
    if (avulsas > 0) partes.push(`${avulsas} un`)
    return partes.join(' + ')
  }

  return `${falta} un`
}
