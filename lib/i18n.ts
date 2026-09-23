'use client'

import { createContext, useContext } from 'react'

// Textos das telas que o funcionário usa. Só essas telas são traduzidas,
// porque só o funcionário escolhe idioma — o dono e o admin ficam em português.
// Nomes de produtos e categorias nunca são traduzidos: são dados da loja.
export const TEXTOS = {
  pt: {
    // navegação
    inicio: 'Início',
    venda: 'Venda',
    produtos: 'Produtos',
    caixa: 'Caixa',
    relatorios: 'Relatórios',
    sair: 'Sair',
    voltar: 'Voltar',
    cancelar: 'Cancelar',
    salvar: 'Salvar',
    confirmar: 'Confirmar',
    carregando: 'Carregando...',

    // venda
    novaVenda: 'Nova venda',
    buscarProduto: 'Escaneie o código de barras ou busque pelo nome',
    todas: 'Todas',
    carrinho: 'Carrinho',
    carrinhoVazio: 'Escaneie um produto ou clique nele na lista',
    total: 'Total',
    finalizarVenda: 'Finalizar venda',
    limpar: 'limpar',
    formaPagamento: 'Forma de pagamento',
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao: 'Cartão',
    quantoPagarAgora: 'Quanto pagar agora',
    valorReceber: 'Valor a receber',
    valorRecebido: 'Valor recebido do cliente',
    troco: 'Troco',
    confirmarRecebimento: 'Confirmar recebimento',
    confirmarRecebido: 'Confirmar recebido',
    confirmarAprovado: 'Confirmar aprovado',
    vendaRegistrada: 'Venda registrada com sucesso!',
    jaPago: 'Já pago',
    falta: 'Falta',
    ondeVaiReceber: 'Onde vai receber',
    minhaChave: 'Minha chave',
    maquininha: 'Maquininha',
    tipo: 'Tipo',
    credito: 'Crédito',
    debito: 'Débito',
    codigoNaoCadastrado: 'não está cadastrado',

    // caixa
    abrirCaixa: 'Abrir caixa',
    fecharCaixa: 'Fechar caixa',
    caixaFechado: 'Caixa fechado',
    saldoEsperado: 'Saldo esperado em dinheiro',
    valorInicial: 'Valor inicial',
    reforco: 'Reforço',
    sangria: 'Sangria',
    movimentosTurno: 'Movimentos do turno',
    valorContado: 'Valor contado',
    diferenca: 'Diferença',
    esperado: 'Esperado',
    semCaixaAberto: 'Nenhum caixa aberto',
    abraCaixaAntes: 'Abra o caixa antes de vender.',

    // produtos
    estoque: 'Estoque',
    estoqueBaixo: 'estoque baixo',
    precoVenda: 'Preço de venda',
    nenhumProduto: 'Nenhum produto encontrado.',

    // troca de usuário
    trocarUsuario: 'Trocar usuário',
    quemEstaOperando: 'Quem está operando?',
    senha: 'Senha',
    entrar: 'Entrar',
    idioma: 'Idioma',
  },
  es: {
    inicio: 'Inicio',
    venda: 'Venta',
    produtos: 'Productos',
    caixa: 'Caja',
    relatorios: 'Informes',
    sair: 'Salir',
    voltar: 'Volver',
    cancelar: 'Cancelar',
    salvar: 'Guardar',
    confirmar: 'Confirmar',
    carregando: 'Cargando...',

    novaVenda: 'Nueva venta',
    buscarProduto: 'Escanee el código de barras o busque por nombre',
    todas: 'Todas',
    carrinho: 'Carrito',
    carrinhoVazio: 'Escanee un producto o haga clic en él en la lista',
    total: 'Total',
    finalizarVenda: 'Finalizar venta',
    limpar: 'vaciar',
    formaPagamento: 'Forma de pago',
    dinheiro: 'Efectivo',
    pix: 'Pix',
    cartao: 'Tarjeta',
    quantoPagarAgora: 'Cuánto pagar ahora',
    valorReceber: 'Importe a cobrar',
    valorRecebido: 'Importe recibido del cliente',
    troco: 'Cambio',
    confirmarRecebimento: 'Confirmar cobro',
    confirmarRecebido: 'Confirmar recibido',
    confirmarAprovado: 'Confirmar aprobado',
    vendaRegistrada: '¡Venta registrada con éxito!',
    jaPago: 'Ya pagado',
    falta: 'Falta',
    ondeVaiReceber: 'Dónde va a recibir',
    minhaChave: 'Mi clave',
    maquininha: 'Terminal',
    tipo: 'Tipo',
    credito: 'Crédito',
    debito: 'Débito',
    codigoNaoCadastrado: 'no está registrado',

    abrirCaixa: 'Abrir caja',
    fecharCaixa: 'Cerrar caja',
    caixaFechado: 'Caja cerrada',
    saldoEsperado: 'Saldo esperado en efectivo',
    valorInicial: 'Importe inicial',
    reforco: 'Ingreso',
    sangria: 'Retiro',
    movimentosTurno: 'Movimientos del turno',
    valorContado: 'Importe contado',
    diferenca: 'Diferencia',
    esperado: 'Esperado',
    semCaixaAberto: 'Ninguna caja abierta',
    abraCaixaAntes: 'Abra la caja antes de vender.',

    estoque: 'Stock',
    estoqueBaixo: 'stock bajo',
    precoVenda: 'Precio de venta',
    nenhumProduto: 'Ningún producto encontrado.',

    trocarUsuario: 'Cambiar usuario',
    quemEstaOperando: '¿Quién está operando?',
    senha: 'Contraseña',
    entrar: 'Entrar',
    idioma: 'Idioma',
  },
} as const

export type Idioma = keyof typeof TEXTOS
export type ChaveTexto = keyof typeof TEXTOS['pt']

export const IdiomaContext = createContext<Idioma>('pt')

// Devolve a função de tradução. Uso: const t = useT(); t('novaVenda')
export function useT() {
  const idioma = useContext(IdiomaContext)
  return (chave: ChaveTexto): string => TEXTOS[idioma][chave] ?? TEXTOS.pt[chave] ?? String(chave)
}

export function useIdioma(): Idioma {
  return useContext(IdiomaContext)
}
