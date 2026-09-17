import { createClient } from './client'

export type VendaResumo = {
  id: string
  data_hora: string
  valor_total: number
  forma_pagamento: string
  status: string
  itensResumo: string
}

export type ItemVendaDetalhe = {
  quantidade: number
  preco_venda_unitario: number
  produtos: { nome: string } | null
}

export type VendaDetalhe = VendaResumo & {
  itens: ItemVendaDetalhe[]
}

function montarResumoItens(itens: { quantidade: number; nome: string }[]): string {
  const partes = itens.map((i) => `${i.quantidade}x ${i.nome}`)
  const texto = partes.join(', ')
  const LIMITE = 46
  return texto.length > LIMITE ? texto.slice(0, LIMITE).trimEnd() + '...' : texto
}

export async function listarVendas(): Promise<VendaResumo[]> {
  const supabase = createClient()
  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('id, data_hora, valor_total, forma_pagamento, status')
    .order('data_hora', { ascending: false })
  if (error) throw error

  const vendaIds = (vendas ?? []).map((v) => v.id)
  if (vendaIds.length === 0) return []

  const { data: itens, error: erroItens } = await supabase
    .from('itens_venda')
    .select('venda_id, quantidade, produtos(nome)')
    .in('venda_id', vendaIds)
  if (erroItens) throw erroItens

  const itensPorVenda: Record<string, { quantidade: number; nome: string }[]> = {}
  for (const item of (itens as any[]) ?? []) {
    if (!itensPorVenda[item.venda_id]) itensPorVenda[item.venda_id] = []
    itensPorVenda[item.venda_id].push({ quantidade: item.quantidade, nome: item.produtos?.nome ?? 'Produto' })
  }

  return (vendas ?? []).map((v) => ({
    ...v,
    itensResumo: montarResumoItens(itensPorVenda[v.id] ?? []),
  }))
}

export async function buscarVenda(id: string): Promise<VendaDetalhe> {
  const supabase = createClient()

  const { data: venda, error: erroVenda } = await supabase
    .from('vendas')
    .select('id, data_hora, valor_total, forma_pagamento, status')
    .eq('id', id)
    .single()
  if (erroVenda) throw erroVenda

  const { data: itens, error: erroItens } = await supabase
    .from('itens_venda')
    .select('quantidade, preco_venda_unitario, produtos(nome)')
    .eq('venda_id', id)
  if (erroItens) throw erroItens

  return { ...venda, itensResumo: '', itens: (itens as any) ?? [] }
}

export async function cancelarVenda(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('cancelar_venda', { p_venda_id: id })
  if (error) throw error
}

export const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
}
