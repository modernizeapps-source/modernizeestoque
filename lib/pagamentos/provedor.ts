// Interface genérica de provedor de pagamento. Hoje só a InfinitePay é
// implementada (veja infinitepay.ts), mas qualquer outra maquininha/provedor
// no futuro (Stone, Cielo, PagBank...) só precisa implementar essa mesma
// interface, sem precisar mexer no resto do sistema.

export type ItemCobranca = {
  descricao: string
  quantidade: number
  precoCentavos: number
}

export type CobrancaCriada = {
  url: string
  orderNsu: string
}

export type ResultadoConsultaPagamento = {
  pago: boolean
  valorPagoCentavos: number | null
  metodo: string | null
  transactionNsu: string | null
}

export interface ProvedorDePagamento {
  criarCobranca(input: {
    orderNsu: string
    itens: ItemCobranca[]
    webhookUrl: string
    redirectUrl: string
  }): Promise<CobrancaCriada>

  consultarPagamento(input: {
    orderNsu: string
    transactionNsu?: string | null
    slug?: string | null
  }): Promise<ResultadoConsultaPagamento>
}
