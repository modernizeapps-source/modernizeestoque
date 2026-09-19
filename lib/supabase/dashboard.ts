import { createClient } from './client'

export type ResumoHoje = {
  totalVendido: number
  lucro: number
  numVendas: number
  produtosEstoqueBaixo: number
  formasPagamento: { forma: string; valor: number; percentual: number }[]
}

// Fortaleza é UTC-3 o ano inteiro (Brasil não usa mais horário de verão)
function inicioHojeFortaleza(): string {
  const agora = new Date()
  const dataFortaleza = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora)
  return `${dataFortaleza}T00:00:00-03:00`
}

export async function buscarResumoHoje(): Promise<ResumoHoje> {
  const supabase = createClient()
  const inicioHoje = inicioHojeFortaleza()

  const { data: vendas, error: erroVendas } = await supabase
    .from('vendas')
    .select('id, valor_total, forma_pagamento')
    .eq('status', 'concluida')
    .gte('data_hora', inicioHoje)
  if (erroVendas) throw erroVendas

  const vendaIds = (vendas ?? []).map((v) => v.id)
  let lucro = 0

  if (vendaIds.length > 0) {
    const { data: itens, error: erroItens } = await supabase
      .from('itens_venda')
      .select('quantidade, preco_venda_unitario, preco_custo_unitario, venda_id')
      .in('venda_id', vendaIds)
    if (erroItens) throw erroItens

    lucro = (itens ?? []).reduce(
      (soma, item) => soma + item.quantidade * (item.preco_venda_unitario - item.preco_custo_unitario),
      0
    )
  }

  const { data: produtosEstoque, error: erroEstoque } = await supabase
    .from('produtos')
    .select('estoque_atual, estoque_minimo')
  if (erroEstoque) throw erroEstoque

  const produtosEstoqueBaixo = (produtosEstoque ?? []).filter((p) => p.estoque_atual <= p.estoque_minimo).length

  const totalVendido = (vendas ?? []).reduce((soma, v) => soma + v.valor_total, 0)

  // Calcula por forma de pagamento a partir da tabela `pagamentos` (não de
  // vendas.forma_pagamento), porque uma venda pode ter mais de um pagamento
  // (pagamento misto) — assim cada forma conta só a sua parte de verdade.
  const porForma: Record<string, number> = {}
  if (vendaIds.length > 0) {
    const { data: pagamentos, error: erroPagamentos } = await supabase
      .from('pagamentos')
      .select('forma, valor, venda_id')
      .in('venda_id', vendaIds)
      .eq('status', 'confirmado')
    if (erroPagamentos) throw erroPagamentos

    for (const p of pagamentos ?? []) {
      porForma[p.forma] = (porForma[p.forma] ?? 0) + Number(p.valor)
    }
  }
  const formasPagamento = Object.entries(porForma)
    .map(([forma, valor]) => ({ forma, valor, percentual: totalVendido > 0 ? (valor / totalVendido) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  return {
    totalVendido,
    lucro,
    numVendas: (vendas ?? []).length,
    produtosEstoqueBaixo: produtosEstoqueBaixo ?? 0,
    formasPagamento,
  }
}
