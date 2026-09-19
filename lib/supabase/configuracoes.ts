import { createClient } from './client'

// Taxas cobradas por cada forma de pagamento, em porcentagem (ex: 3.5 = 3,5%).
// Cada lojista tem contrato e maquininha diferentes, então quem preenche esses
// valores é o próprio lojista, na tela de Configurações.
export type TaxasPagamento = {
  dinheiro: number
  pix_manual: number
  pix_automatico: number
  cartao_maquininha_credito: number
  cartao_maquininha_debito: number
}

export const TAXAS_PADRAO: TaxasPagamento = {
  dinheiro: 0,
  pix_manual: 0,
  pix_automatico: 0,
  cartao_maquininha_credito: 0,
  cartao_maquininha_debito: 0,
}

export const TAXA_LABEL: Record<keyof TaxasPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix_manual: 'Pix (minha chave)',
  pix_automatico: 'Pix automático',
  cartao_maquininha_credito: 'Cartão — crédito',
  cartao_maquininha_debito: 'Cartão — débito',
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

// Descobre qual taxa se aplica a um pagamento. Cartão depende de ser crédito
// ou débito, por isso o tipo_cartao entra na conta.
export function taxaDoPagamento(
  taxas: TaxasPagamento,
  forma: string,
  tipoCartao?: string | null
): number {
  if (forma === 'cartao_maquininha') {
    return tipoCartao === 'debito' ? taxas.cartao_maquininha_debito : taxas.cartao_maquininha_credito
  }
  if (forma === 'dinheiro') return taxas.dinheiro
  if (forma === 'pix_manual') return taxas.pix_manual
  if (forma === 'pix_automatico') return taxas.pix_automatico
  // formas antigas, de vendas registradas antes desta etapa
  if (forma === 'credito') return taxas.cartao_maquininha_credito
  if (forma === 'debito') return taxas.cartao_maquininha_debito
  if (forma === 'pix') return taxas.pix_manual
  return 0
}
