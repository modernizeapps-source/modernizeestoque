import { createClient } from './client'

// Taxas das formas que não são cartão. As de cartão ficam em `maquininhas`,
// porque cada maquininha cobra diferente.
export type TaxasPagamento = {
  dinheiro: number
  pix_manual: number
}

export const TAXAS_PADRAO: TaxasPagamento = {
  dinheiro: 0,
  pix_manual: 0,
}

export const TAXA_LABEL: Record<keyof TaxasPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix_manual: 'Pix',
}

export type Maquininha = {
  id: string
  nome: string
  taxa_credito: number
  taxa_debito: number
  taxa_pix: number
  ativa: boolean
  ordem: number
}

export async function buscarTaxas(): Promise<TaxasPagamento> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'taxas_pagamento')
    .maybeSingle()

  if (error) throw error
  if (!data) return TAXAS_PADRAO
  return { ...TAXAS_PADRAO, ...(data.valor as Partial<TaxasPagamento>) }
}

export async function salvarTaxas(taxas: TaxasPagamento): Promise<void> {
  const supabase = createClient()

  const { data: existente } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('chave', 'taxas_pagamento')
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('configuracoes')
      .update({ valor: taxas, atualizado_em: new Date().toISOString() })
      .eq('id', existente.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('configuracoes').insert({ chave: 'taxas_pagamento', valor: taxas })
    if (error) throw error
  }
}

export async function listarMaquininhas(somenteAtivas = false): Promise<Maquininha[]> {
  const supabase = createClient()
  let query = supabase.from('maquininhas').select('*').order('ordem').order('created_at')
  if (somenteAtivas) query = query.eq('ativa', true)
  const { data, error } = await query
  if (error) throw error
  return (data as any) ?? []
}

export async function criarMaquininha(nome: string, taxaCredito: number, taxaDebito: number, taxaPix: number): Promise<Maquininha> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('maquininhas')
    .insert({ nome, taxa_credito: taxaCredito, taxa_debito: taxaDebito, taxa_pix: taxaPix })
    .select('*')
    .single()
  if (error) throw error
  return data as any
}

export async function atualizarMaquininha(id: string, input: { nome: string; taxa_credito: number; taxa_debito: number; taxa_pix: number }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('maquininhas').update(input).eq('id', id)
  if (error) throw error
}

export async function removerMaquininha(id: string): Promise<void> {
  const supabase = createClient()
  // Não apaga de verdade: vendas antigas apontam pra ela. Só desativa, pra
  // sumir da tela de venda sem quebrar o histórico.
  const { error } = await supabase.from('maquininhas').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

// Descobre a taxa de um pagamento.
// - Cartão: taxa da maquininha usada, crédito ou débito
// - Pix numa maquininha: taxa de Pix daquela maquininha
// - Pix na chave do lojista e dinheiro: taxa geral das configurações
export function taxaDoPagamento(
  taxas: TaxasPagamento,
  maquininhas: Maquininha[],
  forma: string,
  tipoCartao?: string | null,
  maquininhaId?: string | null
): number {
  const maq = maquininhaId ? maquininhas.find((m) => m.id === maquininhaId) : null

  if (forma === 'cartao' || forma === 'cartao_maquininha' || forma === 'credito' || forma === 'debito') {
    const ehDebito = tipoCartao === 'debito' || forma === 'debito'
    if (maq) return Number(ehDebito ? maq.taxa_debito : maq.taxa_credito)
    // pagamento antigo, sem maquininha registrada: usa a média das cadastradas
    if (maquininhas.length === 0) return 0
    const soma = maquininhas.reduce((s, m) => s + Number(ehDebito ? m.taxa_debito : m.taxa_credito), 0)
    return soma / maquininhas.length
  }

  if (forma === 'dinheiro') return taxas.dinheiro

  // Pix: se foi recebido numa maquininha, vale a taxa dela; senão é a chave do lojista
  if (forma === 'pix_manual' || forma === 'pix' || forma === 'pix_automatico') {
    if (maq) return Number(maq.taxa_pix)
    return taxas.pix_manual
  }

  return 0
}
