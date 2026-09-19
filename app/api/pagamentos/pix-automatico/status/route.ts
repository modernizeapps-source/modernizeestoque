import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { criarProvedorDePagamento } from '@/lib/pagamentos/infinitepay'

// Consulta usada como reforço/fallback pela tela de venda, além do webhook —
// assim, mesmo que o webhook atrase ou falhe, o sistema descobre que o
// pagamento caiu ao consultar a InfinitePay diretamente.
export async function GET(req: NextRequest) {
  const pagamentoId = req.nextUrl.searchParams.get('pagamento_id')
  if (!pagamentoId) {
    return NextResponse.json({ erro: 'pagamento_id não informado.' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: pagamento, error } = await supabase
    .from('pagamentos')
    .select('id, status, infinitepay_order_nsu')
    .eq('id', pagamentoId)
    .single()

  if (error || !pagamento) {
    return NextResponse.json({ erro: 'Pagamento não encontrado.' }, { status: 404 })
  }

  if (pagamento.status === 'confirmado') {
    return NextResponse.json({ status: 'confirmado' })
  }

  try {
    const provedor = criarProvedorDePagamento()
    const resultado = await provedor.consultarPagamento({ orderNsu: pagamento.infinitepay_order_nsu! })

    if (resultado.pago) {
      await supabase.rpc('confirmar_pagamento_pendente', {
        p_pagamento_id: pagamentoId,
        p_infinitepay_transaction_nsu: resultado.transactionNsu,
        p_infinitepay_slug: null,
      })
      return NextResponse.json({ status: 'confirmado' })
    }

    return NextResponse.json({ status: 'pendente' })
  } catch (e) {
    return NextResponse.json({ status: 'pendente' })
  }
}
