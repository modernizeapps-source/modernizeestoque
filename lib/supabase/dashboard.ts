import { createClient } from './client'
import { buscarTaxas, listarMaquininhas, taxaDoPagamento } from './configuracoes'

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
  // O mesmo levantamento serve pra descontar as taxas de maquininha do lucro.
  const [taxas, maquininhas] = await Promise.all([buscarTaxas(), listarMaquininhas()])
  const porForma: Record<string, number> = {}
  let taxasTotal = 0
  if (vendaIds.length > 0) {
    const { data: pagamentos, error: erroPagamentos } = await supabase
      .from('pagamentos')
      .select('forma, valor, venda_id, tipo_cartao, maquininha_id')
      .in('venda_id', vendaIds)
      .eq('status', 'confirmado')
    if (erroPagamentos) throw erroPagamentos

    const vendasComPagamento = new Set<string>()
    for (const p of (pagamentos as any[]) ?? []) {
      porForma[p.forma] = (porForma[p.forma] ?? 0) + Number(p.valor)
      vendasComPagamento.add(p.venda_id)
      taxasTotal += Number(p.valor) * (taxaDoPagamento(taxas, maquininhas, p.forma, p.tipo_cartao, p.maquininha_id) / 100)
    }

    // Vendas antigas, anteriores ao módulo de pagamentos
    for (const v of vendas ?? []) {
      if (vendasComPagamento.has(v.id)) continue
      porForma[v.forma_pagamento] = (porForma[v.forma_pagamento] ?? 0) + Number(v.valor_total)
      taxasTotal += v.valor_total * (taxaDoPagamento(taxas, maquininhas, v.forma_pagamento) / 100)
    }
  }
  lucro = lucro - taxasTotal

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

export type PainelDesktop = {
  taxasTotal: number
  ticketMedio: number
  totalOntem: number
  variacaoVsOntem: number | null
  ultimos7Dias: { rotulo: string; total: number; ehHoje: boolean }[]
  ultimasVendas: { id: string; hora: string; resumo: string; valor: number }[]
  produtosParaRepor: { id: string; nome: string; estoque: number; minimo: number; unidadesPorFardo: number | null }[]
  caixaAberto: { id: string; saldoDinheiro: number; abertoEm: string } | null
}

function diaFortaleza(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// Dados extras que só o painel do computador usa. Fica separado de
// buscarResumoHoje pra não deixar o carregamento do celular mais lento.
export async function buscarPainelDesktop(): Promise<PainelDesktop> {
  const supabase = createClient()
  const agora = new Date()

  // ——— Últimos 7 dias (incluindo hoje) ———
  const diasChave: string[] = []
  const rotulos: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(agora.getTime() - i * 86400000)
    diasChave.push(diaFortaleza(d))
    rotulos.push(
      i === 0 ? 'hoje'
      : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza', weekday: 'short' })
          .format(d).replace('.', '').slice(0, 3)
    )
  }
  const inicio7Dias = `${diasChave[0]}T00:00:00-03:00`

  const { data: vendas7, error: erro7 } = await supabase
    .from('vendas')
    .select('id, data_hora, valor_total')
    .eq('status', 'concluida')
    .gte('data_hora', inicio7Dias)
    .order('data_hora', { ascending: false })
  if (erro7) throw erro7

  const porDia: Record<string, number> = {}
  for (const v of vendas7 ?? []) {
    const dia = diaFortaleza(new Date(v.data_hora))
    porDia[dia] = (porDia[dia] ?? 0) + Number(v.valor_total)
  }

  const ultimos7Dias = diasChave.map((dia, i) => ({
    rotulo: rotulos[i],
    total: porDia[dia] ?? 0,
    ehHoje: i === diasChave.length - 1,
  }))

  const hojeChave = diasChave[diasChave.length - 1]
  const ontemChave = diasChave[diasChave.length - 2]
  const totalHoje = porDia[hojeChave] ?? 0
  const totalOntem = porDia[ontemChave] ?? 0
  const variacaoVsOntem = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem) * 100 : null

  const vendasHoje = (vendas7 ?? []).filter((v) => diaFortaleza(new Date(v.data_hora)) === hojeChave)
  const ticketMedio = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0

  // ——— Últimas 5 vendas de hoje, com resumo dos itens ———
  const idsRecentes = vendasHoje.slice(0, 5).map((v) => v.id)
  const resumoPorVenda: Record<string, string> = {}

  if (idsRecentes.length > 0) {
    const { data: itens } = await supabase
      .from('itens_venda')
      .select('venda_id, quantidade, produtos(nome)')
      .in('venda_id', idsRecentes)

    const agrupado: Record<string, string[]> = {}
    for (const it of (itens as any[]) ?? []) {
      if (!agrupado[it.venda_id]) agrupado[it.venda_id] = []
      agrupado[it.venda_id].push(`${it.quantidade}x ${it.produtos?.nome ?? 'Produto'}`)
    }
    for (const [id, partes] of Object.entries(agrupado)) {
      const texto = partes.join(', ')
      resumoPorVenda[id] = texto.length > 38 ? texto.slice(0, 38).trimEnd() + '...' : texto
    }
  }

  const ultimasVendas = vendasHoje.slice(0, 5).map((v) => ({
    id: v.id,
    hora: new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit',
    }).format(new Date(v.data_hora)),
    resumo: resumoPorVenda[v.id] ?? '',
    valor: Number(v.valor_total),
  }))

  // ——— Produtos que precisam de reposição ———
  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, nome, estoque_atual, estoque_minimo, unidades_por_fardo, categorias(unidades_por_fardo)')
    .order('estoque_atual', { ascending: true })

  const produtosParaRepor = ((produtos ?? []) as any[])
    .filter((p) => p.estoque_atual <= p.estoque_minimo)
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      estoque: p.estoque_atual,
      minimo: p.estoque_minimo,
      // o fardo é do produto; a categoria só vale pra quem ainda não configurou
      unidadesPorFardo: p.unidades_por_fardo ?? p.categorias?.unidades_por_fardo ?? null,
    }))

  // ——— Caixa aberto e quanto tem de dinheiro nele ———
  const { data: sessao } = await supabase
    .from('caixa_sessoes')
    .select('id, valor_inicial, aberto_em')
    .eq('status', 'aberto')
    .maybeSingle()

  let caixaAberto: PainelDesktop['caixaAberto'] = null
  if (sessao) {
    const { data: pagsDinheiro } = await supabase
      .from('pagamentos')
      .select('valor, vendas!inner(caixa_sessao_id)')
      .eq('vendas.caixa_sessao_id', sessao.id)
      .eq('forma', 'dinheiro')
      .eq('status', 'confirmado')

    const { data: movs } = await supabase
      .from('caixa_movimentos')
      .select('tipo, valor')
      .eq('caixa_sessao_id', sessao.id)

    const entradas = ((pagsDinheiro as any[]) ?? []).reduce((s, p) => s + Number(p.valor), 0)
    const reforcos = ((movs as any[]) ?? []).filter((m) => m.tipo === 'reforco').reduce((s, m) => s + Number(m.valor), 0)
    const sangrias = ((movs as any[]) ?? []).filter((m) => m.tipo === 'sangria').reduce((s, m) => s + Number(m.valor), 0)

    caixaAberto = {
      id: sessao.id,
      saldoDinheiro: Number(sessao.valor_inicial) + entradas + reforcos - sangrias,
      abertoEm: new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit',
      }).format(new Date(sessao.aberto_em)),
    }
  }

  // ——— Taxas descontadas hoje (pra mostrar embaixo do lucro) ———
  const [taxas, maquininhas] = await Promise.all([buscarTaxas(), listarMaquininhas()])
  let taxasTotal = 0
  const idsHoje = vendasHoje.map((v) => v.id)
  if (idsHoje.length > 0) {
    const { data: pags } = await supabase
      .from('pagamentos')
      .select('forma, valor, tipo_cartao, maquininha_id')
      .in('venda_id', idsHoje)
      .eq('status', 'confirmado')
    for (const p of (pags as any[]) ?? []) {
      taxasTotal += Number(p.valor) * (taxaDoPagamento(taxas, maquininhas, p.forma, p.tipo_cartao, p.maquininha_id) / 100)
    }
  }

  return { taxasTotal, ticketMedio, totalOntem, variacaoVsOntem, ultimos7Dias, ultimasVendas, produtosParaRepor, caixaAberto }
}
