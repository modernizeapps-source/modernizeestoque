import { createClient } from './client'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export type LimitesPeriodo = { manha: number; tarde: number; noite: number }
export const LIMITES_PADRAO: LimitesPeriodo = { manha: 6, tarde: 12, noite: 18 }

function montarPeriodosDia(limites: LimitesPeriodo) {
  const fmtHora = (h: number) => `${String(h).padStart(2, '0')}h`
  return [
    { id: 'madrugada', nome: 'Madrugada', horario: `${fmtHora(0)}–${fmtHora(limites.manha)}`, min: 0, max: limites.manha },
    { id: 'manha', nome: 'Manhã', horario: `${fmtHora(limites.manha)}–${fmtHora(limites.tarde)}`, min: limites.manha, max: limites.tarde },
    { id: 'tarde', nome: 'Tarde', horario: `${fmtHora(limites.tarde)}–${fmtHora(limites.noite)}`, min: limites.tarde, max: limites.noite },
    { id: 'noite', nome: 'Noite', horario: `${fmtHora(limites.noite)}–24h`, min: limites.noite, max: 24 },
  ]
}

function diaSemanaEHoraFortaleza(isoString: string) {
  const d = new Date(isoString)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)

  const get = (tipo: string) => parts.find((p) => p.type === tipo)?.value
  const ano = Number(get('year'))
  const mes = Number(get('month'))
  const dia = Number(get('day'))
  const hora = Number(get('hour'))

  const dataSó = new Date(Date.UTC(ano, mes - 1, dia))
  const diaSemana = dataSó.getUTCDay() // 0 = domingo
  const dataChave = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

  return { diaSemana, hora, dataChave, ano, mes }
}

export function inicioFimPeriodo(periodo: 'hoje' | 'semana' | 'mes'): { inicio: string; fim: string } {
  const agora = new Date()
  const hojeParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(agora)
    .split('-')
    .map(Number)
  const [ano, mes, dia] = hojeParts
  const hojeUTC = new Date(Date.UTC(ano, mes - 1, dia))
  const diaSemanaHoje = hojeUTC.getUTCDay()

  let inicioData: Date
  if (periodo === 'hoje') {
    inicioData = hojeUTC
  } else if (periodo === 'semana') {
    inicioData = new Date(Date.UTC(ano, mes - 1, dia - diaSemanaHoje))
  } else {
    inicioData = new Date(Date.UTC(ano, mes - 1, 1))
  }

  const fimData = new Date(Date.UTC(ano, mes - 1, dia + 1))

  const fmt = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dd}T00:00:00-03:00`
  }

  return { inicio: fmt(inicioData), fim: fmt(fimData) }
}

export type Relatorio = {
  totalVendido: number
  lucro: number
  numVendas: number
  ticketMedio: number
  porDiaSemana: { dia: string; total: number; ocorrencias: number }[]
  porPeriodoDia: { id: string; nome: string; horario: string; total: number; topProduto: string | null }[]
  porCategoria: { nome: string; lucro: number }[]
  maisVendidos: { nome: string; quantidade: number; valor: number }[]
  menosVendidos: { nome: string; quantidade: number; valor: number }[]
  formasPagamento: { forma: string; valor: number; percentual: number }[]
}

export async function buscarRelatorio(inicio: string, fim: string, limitesPeriodo: LimitesPeriodo = LIMITES_PADRAO): Promise<Relatorio> {
  const supabase = createClient()
  const PERIODOS_DIA = montarPeriodosDia(limitesPeriodo)

  const { data: vendas, error: erroVendas } = await supabase
    .from('vendas')
    .select('id, data_hora, valor_total, forma_pagamento')
    .eq('status', 'concluida')
    .gte('data_hora', inicio)
    .lt('data_hora', fim)
  if (erroVendas) throw erroVendas

  const vendaIds = (vendas ?? []).map((v) => v.id)
  const vendaPorId = new Map((vendas ?? []).map((v) => [v.id, v]))

  let itens: any[] = []
  if (vendaIds.length > 0) {
    const { data, error } = await supabase
      .from('itens_venda')
      .select('venda_id, produto_id, quantidade, preco_venda_unitario, preco_custo_unitario, produtos(nome, categoria_id, categorias(nome))')
      .in('venda_id', vendaIds)
    if (error) throw error
    itens = data ?? []
  }

  const totalVendido = (vendas ?? []).reduce((s, v) => s + v.valor_total, 0)
  const numVendas = (vendas ?? []).length
  const ticketMedio = numVendas > 0 ? totalVendido / numVendas : 0
  const lucro = itens.reduce((s, i) => s + i.quantidade * (i.preco_venda_unitario - i.preco_custo_unitario), 0)

  // Por dia da semana (soma por venda + contagem de dias distintos que ocorreram)
  const somaPorDia: number[] = [0, 0, 0, 0, 0, 0, 0]
  const diasVistosPorDia: Set<string>[] = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()]
  for (const v of vendas ?? []) {
    const { diaSemana, dataChave } = diaSemanaEHoraFortaleza(v.data_hora)
    somaPorDia[diaSemana] += v.valor_total
    diasVistosPorDia[diaSemana].add(dataChave)
  }
  const porDiaSemana = DIAS_SEMANA.map((dia, i) => ({ dia, total: somaPorDia[i], ocorrencias: diasVistosPorDia[i].size }))

  // Por período do dia
  const somaPorPeriodo: Record<string, number> = {}
  const produtoPorPeriodo: Record<string, Record<string, number>> = {}
  for (const item of itens) {
    const venda = vendaPorId.get(item.venda_id)
    if (!venda) continue
    const { hora } = diaSemanaEHoraFortaleza(venda.data_hora)
    const periodo = PERIODOS_DIA.find((p) => hora >= p.min && hora < p.max)
    if (!periodo) continue
    const valorItem = item.quantidade * item.preco_venda_unitario
    somaPorPeriodo[periodo.id] = (somaPorPeriodo[periodo.id] ?? 0) + valorItem

    const nomeProduto = item.produtos?.nome ?? 'Produto'
    if (!produtoPorPeriodo[periodo.id]) produtoPorPeriodo[periodo.id] = {}
    produtoPorPeriodo[periodo.id][nomeProduto] = (produtoPorPeriodo[periodo.id][nomeProduto] ?? 0) + item.quantidade
  }
  const porPeriodoDia = PERIODOS_DIA.map((p) => {
    const produtosDoPeriodo = produtoPorPeriodo[p.id] ?? {}
    const topProduto = Object.entries(produtosDoPeriodo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return { id: p.id, nome: p.nome, horario: p.horario, total: somaPorPeriodo[p.id] ?? 0, topProduto }
  })

  // Lucro por categoria
  const lucroPorCategoria: Record<string, number> = {}
  for (const item of itens) {
    const nomeCategoria = item.produtos?.categorias?.nome ?? 'Sem categoria'
    const lucroItem = item.quantidade * (item.preco_venda_unitario - item.preco_custo_unitario)
    lucroPorCategoria[nomeCategoria] = (lucroPorCategoria[nomeCategoria] ?? 0) + lucroItem
  }
  const porCategoria = Object.entries(lucroPorCategoria)
    .map(([nome, lucro]) => ({ nome, lucro }))
    .sort((a, b) => b.lucro - a.lucro)

  // Ranking de produtos
  const porProduto: Record<string, { quantidade: number; valor: number }> = {}
  for (const item of itens) {
    const nome = item.produtos?.nome ?? 'Produto'
    if (!porProduto[nome]) porProduto[nome] = { quantidade: 0, valor: 0 }
    porProduto[nome].quantidade += item.quantidade
    porProduto[nome].valor += item.quantidade * item.preco_venda_unitario
  }
  const rankingCompleto = Object.entries(porProduto).map(([nome, v]) => ({ nome, ...v }))
  const maisVendidos = [...rankingCompleto].sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)
  const menosVendidos = [...rankingCompleto].sort((a, b) => a.quantidade - b.quantidade).slice(0, 5)

  // Formas de pagamento
  const porForma: Record<string, number> = {}
  for (const v of vendas ?? []) {
    porForma[v.forma_pagamento] = (porForma[v.forma_pagamento] ?? 0) + v.valor_total
  }
  const formasPagamento = Object.entries(porForma)
    .map(([forma, valor]) => ({ forma, valor, percentual: totalVendido > 0 ? (valor / totalVendido) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)

  return { totalVendido, lucro, numVendas, ticketMedio, porDiaSemana, porPeriodoDia, porCategoria, maisVendidos, menosVendidos, formasPagamento }
}

// Evolução histórica: total acumulado de um dia da semana específico, mês a mês
export type PontoEvolucao = { label: string; total: number }

function anoMesFortaleza(d: Date): { ano: number; mes: number } {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit' })
    .format(d)
    .split('-')
    .map(Number)
  return { ano: partes[0], mes: partes[1] }
}

export async function buscarEvolucaoDiaSemana(diaSemana: number, numMeses = 7): Promise<PontoEvolucao[]> {
  const supabase = createClient()
  const agora = new Date()
  const { ano: anoAtual, mes: mesAtual } = anoMesFortaleza(agora)

  const inicioRange = new Date(Date.UTC(anoAtual, mesAtual - numMeses, 1))
  const inicioISO = `${inicioRange.getUTCFullYear()}-${String(inicioRange.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00-03:00`
  const fimISO = agora.toISOString()

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('data_hora, valor_total')
    .eq('status', 'concluida')
    .gte('data_hora', inicioISO)
    .lt('data_hora', fimISO)
  if (error) throw error

  const somaPorMes: Record<string, number> = {}
  for (const v of vendas ?? []) {
    const { diaSemana: ds, ano, mes } = diaSemanaEHoraFortaleza(v.data_hora)
    if (ds !== diaSemana) continue
    const chave = `${ano}-${mes}`
    somaPorMes[chave] = (somaPorMes[chave] ?? 0) + v.valor_total
  }

  const pontos: PontoEvolucao[] = []
  for (let i = numMeses - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anoAtual, mesAtual - 1 - i, 1))
    const ano = d.getUTCFullYear()
    const mes = d.getUTCMonth() + 1
    const chave = `${ano}-${mes}`
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(d).replace('.', '')
    pontos.push({ label, total: somaPorMes[chave] ?? 0 })
  }

  return pontos
}

// Fechamento mensal: total vendido em cada mês de um ano específico
export type PontoMensal = { label: string; total: number }

export async function buscarFechamentoMensal(ano: number): Promise<PontoMensal[]> {
  const supabase = createClient()
  const inicioISO = `${ano}-01-01T00:00:00-03:00`
  const fimISO = `${ano + 1}-01-01T00:00:00-03:00`

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('data_hora, valor_total')
    .eq('status', 'concluida')
    .gte('data_hora', inicioISO)
    .lt('data_hora', fimISO)
  if (error) throw error

  const somaPorMes = new Array(12).fill(0)
  for (const v of vendas ?? []) {
    const { mes } = diaSemanaEHoraFortaleza(v.data_hora)
    somaPorMes[mes - 1] += v.valor_total
  }

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return MESES.map((label, i) => ({ label, total: somaPorMes[i] }))
}
