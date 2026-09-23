import { createClient } from './client'

export type CaixaSessao = {
  id: string
  valor_inicial: number
  valor_contado: number | null
  valor_esperado: number | null
  divergencia: number | null
  observacao: string | null
  status: 'aberto' | 'fechado'
  aberto_em: string
  fechado_em: string | null
}

export type CaixaMovimento = {
  id: string
  tipo: 'reforco' | 'sangria'
  valor: number
  motivo: string
  created_at: string
}

export async function buscarCaixaAberto(): Promise<CaixaSessao | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('status', 'aberto')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function abrirCaixa(valorInicial: number): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('abrir_caixa', { p_valor_inicial: valorInicial })
  if (error) throw error
  return data as string
}

export async function registrarMovimentoCaixa(
  caixaSessaoId: string,
  tipo: 'reforco' | 'sangria',
  valor: number,
  motivo: string
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('registrar_movimento_caixa', {
    p_caixa_sessao_id: caixaSessaoId,
    p_tipo: tipo,
    p_valor: valor,
    p_motivo: motivo,
  })
  if (error) throw error
  return data as string
}

export async function listarMovimentosCaixa(caixaSessaoId: string): Promise<CaixaMovimento[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_movimentos')
    .select('id, tipo, valor, motivo, created_at')
    .eq('caixa_sessao_id', caixaSessaoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fecharCaixa(
  caixaSessaoId: string,
  valorContado: number,
  observacao?: string
): Promise<{ valor_esperado: number; divergencia: number }> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('fechar_caixa', {
    p_caixa_sessao_id: caixaSessaoId,
    p_valor_contado: valorContado,
    p_observacao: observacao ?? null,
  })
  if (error) throw error
  const row = (data as any[])[0]
  return { valor_esperado: Number(row.valor_esperado), divergencia: Number(row.divergencia) }
}

export async function listarHistoricoCaixa(): Promise<CaixaSessao[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('status', 'fechado')
    .order('fechado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Totais confirmados por forma de pagamento de uma sessão de caixa
export async function totaisPorFormaDoCaixa(caixaSessaoId: string): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagamentos')
    .select('forma, valor, vendas!inner(caixa_sessao_id)')
    .eq('vendas.caixa_sessao_id', caixaSessaoId)
    .eq('status', 'confirmado')
  if (error) throw error

  const totais: Record<string, number> = {}
  for (const p of (data as any[]) ?? []) {
    totais[p.forma] = (totais[p.forma] ?? 0) + Number(p.valor)
  }
  return totais
}

export type CorrecaoCaixa = {
  id: string
  valor_anterior: number
  valor_novo: number
  motivo: string | null
  criado_em: string
}

// Corrige o valor digitado errado na abertura do caixa. Não é movimentação de
// dinheiro — é conserto de informação, então não vira reforço nem sangria.
// A alteração fica registrada com valor antigo, novo, motivo e quem fez.
export async function corrigirValorInicialCaixa(
  caixaSessaoId: string,
  valorNovo: number,
  motivo: string
): Promise<void> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()

  const { error } = await supabase.rpc('corrigir_valor_inicial_caixa', {
    p_caixa_sessao_id: caixaSessaoId,
    p_valor_novo: valorNovo,
    p_motivo: motivo || null,
    p_corrigido_por: auth.user?.id ?? null,
  })
  if (error) throw error
}

export async function listarCorrecoesCaixa(caixaSessaoId: string): Promise<CorrecaoCaixa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_correcoes')
    .select('id, valor_anterior, valor_novo, motivo, criado_em')
    .eq('caixa_sessao_id', caixaSessaoId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return (data as any) ?? []
}
