import { createClient } from './client'

export type ItemCarrinho = {
  produto_id: string
  quantidade: number
  preco_venda_unitario: number
  preco_custo_unitario: number
}

export async function finalizarVenda(itens: ItemCarrinho[], formaPagamento: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('finalizar_venda', {
    p_forma_pagamento: formaPagamento,
    p_itens: itens,
  })

  if (error) throw error
  return data as string
}
