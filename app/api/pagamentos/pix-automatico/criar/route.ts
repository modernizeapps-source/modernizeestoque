import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { criarProvedorDePagamento } from '@/lib/pagamentos/infinitepay'

export async function POST(req: NextRequest) {
  try {
    const { venda_id, valor } = await req.json()

    if (!venda_id || !valor) {
      return NextResponse.json({ erro: 'Dados incompletos.' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://modernizeestoque.netlify.app').replace(/\/$/, '')

    // Cria o registro de pagamento pendente primeiro — o id dele vira o order_nsu
    const { data: pagamentoId, error: erroPagamento } = await supabase.rpc('adicionar_pagamento_pendente', {
      p_venda_id: venda_id,
      p_forma: 'pix_automatico',
      p_valor: valor,
      p_infinitepay_order_nsu: null,
    })
    if (erroPagamento) throw erroPagamento

    const provedor = criarProvedorDePagamento()

    // Sempre usa um único item com o valor exato deste pagamento (não a lista
    // de produtos do carrinho inteiro) — assim, mesmo em pagamento misto (parte
    // já paga em dinheiro, o resto no Pix automático), a cobrança gerada bate
    // exatamente com o valor que falta, nunca com o total da venda inteira.
    const itensCobranca = [{ descricao: 'Compra no mercadinho', quantidade: 1, precoCentavos: Math.round(valor * 100) }]

    const cobranca = await provedor.criarCobranca({
      orderNsu: pagamentoId as string,
      itens: itensCobranca,
      webhookUrl: `${siteUrl}/api/webhooks/infinitepay`,
      redirectUrl: `${siteUrl}/venda`,
    })

    await supabase.from('pagamentos').update({ infinitepay_order_nsu: cobranca.orderNsu }).eq('id', pagamentoId)

    return NextResponse.json({ pagamento_id: pagamentoId, url: cobranca.url })
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message ?? 'Não foi possível criar a cobrança Pix.' }, { status: 500 })
  }
}
