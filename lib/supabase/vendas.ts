import { createClient } from './client'

export type ItemCarrinho = {
  produto_id: string
  quantidade: number
  preco_venda_unitario: number
  preco_custo_unitario: number
}

export type FormaPagamento = 'dinheiro' | 'pix_manual' | 'cartao'

export type Pagamento = {
  id: string
  venda_id: string
  forma: FormaPagamento
  valor: number
  status: 'pendente' | 'confirmado' | 'falhou' | 'estorno_pendente' | 'estornado'
  valor_recebido: number | null
  troco: number | null
  bandeira: string | null
  tipo_cartao: string | null
  infinitepay_order_nsu: string | null
  infinitepay_transaction_nsu: string | null
  infinitepay_slug: string | null
  confirmado_em: string | null
  created_at: string
}

export async function criarVenda(itens: ItemCarrinho[], caixaSessaoId: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('criar_venda', {
    p_itens: itens,
    p_caixa_sessao_id: caixaSessaoId,
  })
  if (error) throw error
  return data as string
}

export async function adicionarPagamentoConfirmado(input: {
  venda_id: string
  forma: 'dinheiro' | 'cartao'
  valor: number
  valor_recebido?: number
  troco?: number
  tipo_cartao?: string
  maquininha_id?: string | null
}): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('adicionar_pagamento_confirmado', {
    p_venda_id: input.venda_id,
    p_forma: input.forma,
    p_valor: input.valor,
    p_valor_recebido: input.valor_recebido ?? null,
    p_troco: input.troco ?? null,
    p_bandeira: null,
    p_tipo_cartao: input.tipo_cartao ?? null,
    p_maquininha_id: input.maquininha_id ?? null,
  })
  if (error) throw error
  return data as string
}

export async function adicionarPagamentoPendente(input: {
  venda_id: string
  forma: 'pix_manual'
  valor: number
  maquininha_id?: string | null
}): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('adicionar_pagamento_pendente', {
    p_venda_id: input.venda_id,
    p_forma: input.forma,
    p_valor: input.valor,
    p_infinitepay_order_nsu: null,
    p_maquininha_id: input.maquininha_id ?? null,
  })
  if (error) throw error
  return data as string
}

export async function confirmarPagamentoPendente(pagamentoId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('confirmar_pagamento_pendente', { p_pagamento_id: pagamentoId })
  if (error) throw error
}

export async function buscarStatusVenda(vendaId: string): Promise<{ status: string; estoque_baixado: boolean }> {
  const supabase = createClient()
  const { data, error } = await supabase.from('vendas').select('status, estoque_baixado').eq('id', vendaId).single()
  if (error) throw error
  return data as any
}

export async function listarPagamentosDaVenda(vendaId: string): Promise<Pagamento[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('pagamentos').select('*').eq('venda_id', vendaId).order('created_at')
  if (error) throw error
  return (data as any) ?? []
}

// Descarta uma venda que foi iniciada mas nunca teve pagamento (o cliente
// desistiu antes de pagar). Como nada foi pago e o estoque nem chegou a ser
// baixado, ela é só marcada como cancelada.
export async function cancelarVendaNaoPaga(vendaId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.rpc('cancelar_venda', {
    p_venda_id: vendaId,
    p_motivo: 'Venda não finalizada',
    p_retorna_estoque: false,
  })
  if (error) throw error
}
