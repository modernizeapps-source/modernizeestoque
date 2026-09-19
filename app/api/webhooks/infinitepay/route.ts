import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { criarProvedorDePagamento } from '@/lib/pagamentos/infinitepay'

// Recebe o aviso automático da InfinitePay quando um pagamento é confirmado.
// Nunca confia só nesse aviso: sempre confirma de novo com a própria InfinitePay
// (payment_check) antes de dar a venda como paga — protege contra avisos falsos
// ou repetidos.
export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  try {
    const payload = await req.json()
    const { order_nsu, transaction_nsu, invoice_slug } = payload

    if (!order_nsu || !transaction_nsu) {
      return NextResponse.json({ success: false, message: 'Dados incompletos.' }, { status: 400 })
    }

    // Idempotência: se já processamos esse aviso antes, responde ok sem refazer nada
    const { error: erroInsercao } = await supabase
      .from('pagamento_webhook_eventos')
      .insert({ transaction_nsu, invoice_slug: invoice_slug ?? null, order_nsu, payload })

    if (erroInsercao) {
      if ((erroInsercao as any).code === '23505') {
        return NextResponse.json({ success: true, message: null })
      }
      throw erroInsercao
    }

    const { data: pagamento } = await supabase
      .from('pagamentos')
      .select('id, status')
      .eq('id', order_nsu)
      .maybeSingle()

    if (!pagamento) {
      return NextResponse.json({ success: false, message: 'Pedido não encontrado.' }, { status: 400 })
    }

    if (pagamento.status === 'confirmado') {
      return NextResponse.json({ success: true, message: null })
    }

    const provedor = criarProvedorDePagamento()
    const confirmado = await provedor.consultarPagamento({
      orderNsu: order_nsu,
      transactionNsu: transaction_nsu,
      slug: invoice_slug,
    })

    if (!confirmado.pago) {
      return NextResponse.json({ success: false, message: 'A InfinitePay não confirmou esse pagamento como pago.' }, { status: 400 })
    }

    await supabase.rpc('confirmar_pagamento_pendente', {
      p_pagamento_id: pagamento.id,
      p_infinitepay_transaction_nsu: transaction_nsu,
      p_infinitepay_slug: invoice_slug ?? null,
    })

    return NextResponse.json({ success: true, message: null })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message ?? 'Erro interno.' }, { status: 400 })
  }
}
