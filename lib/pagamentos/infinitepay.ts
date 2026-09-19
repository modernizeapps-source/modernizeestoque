import { ProvedorDePagamento, ItemCobranca, CobrancaCriada, ResultadoConsultaPagamento } from './provedor'

const BASE_URL = 'https://api.checkout.infinitepay.io'

// Adaptador da InfinitePay. Implementa a interface genérica ProvedorDePagamento
// — é o único lugar do sistema que conversa diretamente com a API da InfinitePay.
export class InfinitePayAdapter implements ProvedorDePagamento {
  constructor(private handle: string) {}

  async criarCobranca(input: {
    orderNsu: string
    itens: ItemCobranca[]
    webhookUrl: string
    redirectUrl: string
  }): Promise<CobrancaCriada> {
    const resposta = await fetch(`${BASE_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: this.handle,
        order_nsu: input.orderNsu,
        webhook_url: input.webhookUrl,
        redirect_url: input.redirectUrl,
        items: input.itens.map((i) => ({
          quantity: i.quantidade,
          price: i.precoCentavos,
          description: i.descricao,
        })),
      }),
    })

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '')
      throw new Error(`A InfinitePay recusou a criação da cobrança (${resposta.status}): ${texto}`)
    }

    const dados = await resposta.json()
    if (!dados.url) throw new Error('A InfinitePay não retornou um link de pagamento.')

    return { url: dados.url as string, orderNsu: input.orderNsu }
  }

  async consultarPagamento(input: {
    orderNsu: string
    transactionNsu?: string | null
    slug?: string | null
  }): Promise<ResultadoConsultaPagamento> {
    const resposta = await fetch(`${BASE_URL}/payment_check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: this.handle,
        order_nsu: input.orderNsu,
        transaction_nsu: input.transactionNsu ?? undefined,
        slug: input.slug ?? undefined,
      }),
    })

    if (!resposta.ok) {
      return { pago: false, valorPagoCentavos: null, metodo: null, transactionNsu: null }
    }

    const dados = await resposta.json()
    return {
      pago: !!dados.paid,
      valorPagoCentavos: typeof dados.paid_amount === 'number' ? dados.paid_amount : null,
      metodo: dados.capture_method ?? null,
      transactionNsu: input.transactionNsu ?? null,
    }
  }
}

export function criarProvedorDePagamento(): ProvedorDePagamento {
  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) throw new Error('A variável INFINITEPAY_HANDLE não está configurada.')
  return new InfinitePayAdapter(handle)
}
