# Estoque Mercadinho — Fase 1: Caixa, Pagamentos e Código de Barras

## O banco de dados já foi atualizado

Diferente das vezes anteriores, desta vez eu já criei as tabelas e funções novas
diretamente no seu banco de dados do Supabase (você não precisa copiar e colar
nenhum SQL lá). Só falta configurar 3 coisas antes de tudo funcionar de verdade,
explicadas no próximo passo.

## Passo 1 — Variáveis novas no Netlify

Vá em **Netlify → seu site → Site settings → Environment variables** e adicione
estas 4 variáveis (além das 2 que já existiam):

| Nome | O que é | Onde conseguir |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Uma chave "mestra" do Supabase, usada só pelo servidor (nunca aparece pro cliente) | Painel do Supabase → **Project Settings → API** → copie a chave em **service_role** (não é a mesma chave "anon" que você já usa) |
| `INFINITEPAY_HANDLE` | O "@" do Misa no app da InfinitePay, **sem** o cifrão `$` na frente | Abra o app da InfinitePay do Misa, o handle aparece no canto superior esquerdo |
| `COSMOS_API_TOKEN` | Token pra busca automática de produto por código de barras (opcional) | Veja o Passo 3 abaixo — se não configurar, essa busca automática simplesmente não funciona, mas o resto do sistema funciona normal |
| `NEXT_PUBLIC_SITE_URL` | O endereço do seu site publicado | `https://modernizeestoque.netlify.app` |

Depois de adicionar, vá em **Deploys → Trigger deploy → Deploy project without
cache** pra aplicar.

## Passo 2 — Habilitar o Checkout Integrado na InfinitePay

Isso é o que permite o sistema gerar o QR Code do Pix automático. O Misa precisa
fazer isso (é a conta dele):

1. Abrir o app da InfinitePay (ou o site: app.infinitepay.io)
2. Ir na aba **Vendas** → deslizar até **Checkout**
3. Ir em **Configurações** → tocar em **Habilitar Checkout Integrado**

Sem isso, o Pix automático não vai funcionar — mas dinheiro, Pix manual e cartão
na maquininha funcionam normalmente de qualquer forma.

## Passo 3 (opcional) — Token do Cosmos

O Cosmos é o catálogo que preenche o nome do produto sozinho ao escanear um
código de barras novo. Pra ativar:

1. Acesse `https://cosmos.bluesoft.com.br/`
2. Crie uma conta e pegue o seu token de acesso
3. Cole esse token na variável `COSMOS_API_TOKEN` no Netlify (Passo 1)

Se você pular esse passo por enquanto, tudo bem — o cadastro de produto
continua funcionando, só não vem com o nome pré-preenchido.

## Como testar no seu computador

Igual sempre: extraia o zip, `cd` até a pasta, rode `npm install` (dessa vez é
importante rodar de novo, porque adicionei uma ferramenta nova pro QR Code) e
depois `npm run dev`.

## O que veio nesta etapa

### Caixa
- Tela nova **Caixa** (botão na tela inicial): abre o caixa informando o valor
  inicial, permite registrar reforço/sangria durante o dia, e fechar no final
  comparando o valor esperado com o valor contado
- Não dá mais pra vender sem um caixa aberto — a tela de Venda avisa e te
  manda abrir o caixa primeiro
- **Histórico de caixa** (dentro da tela Caixa) mostra os fechamentos
  anteriores

### Pagamentos
- A tela de Venda agora tem 4 formas de pagamento: Dinheiro (com troco), Pix
  com sua própria chave (confirmação manual), Cartão na maquininha (registra
  bandeira e crédito/débito) e **Pix automático** (gera QR Code de verdade via
  InfinitePay e confirma sozinho quando o cliente paga)
- Dá pra dividir uma venda em mais de uma forma de pagamento (ex: metade
  dinheiro, metade Pix) — é só ir escolhendo uma forma de cada vez até
  completar o valor
- O estoque só é descontado depois que o pagamento é confirmado de verdade,
  nunca antes

### Código de barras
- Comprou um leitor USB? Basta conectar — ele funciona como um teclado, sem
  instalar nada
- Na tela de Venda: aponte o leitor pro produto e ele entra na venda sozinho.
  Se o código não estiver cadastrado, aparece um aviso com atalho pra cadastrar
  na hora
- Na tela de Novo produto: escaneie o código pra preencher o campo sozinho —
  se o produto for reconhecido pelo Cosmos, o nome/marca já vêm preenchidos

### Cancelamento e estorno
- Cancelar uma venda que ainda não foi paga é diferente de estornar uma venda
  já paga — o sistema trata cada caso e pede o motivo
- Você escolhe se os produtos voltam pro estoque no estorno
- Estorno de dinheiro é registrado automaticamente como saída no caixa;
  estorno de Pix/cartão fica marcado como pendente pra você fazer manualmente
  no app da InfinitePay

## Roteiro de teste sugerido

1. Vá em **Caixa** e abra um caixa de teste com R$ 50,00
2. Vá em **Venda**, adicione 1 ou 2 produtos, finalize com **Dinheiro** — confira
   o cálculo do troco
3. Faça outra venda e finalize com **Pix automático** — deve aparecer um QR Code
   de verdade; escaneie com seu próprio celular pra testar um pagamento
   pequeno de verdade (ou cancele antes de pagar, só pra ver se o QR aparece)
4. Volte em **Caixa** e confira se o saldo esperado bateu
5. Vá em **Produtos → Novo produto**, escaneie um código de barras de algum
   produto de mercado que você tenha em casa e veja se o nome preenche sozinho
   (só funciona se configurou o Cosmos)
6. No **Histórico**, abra uma venda paga e teste o **Estornar venda**
7. Feche o caixa em **Caixa → Fechar caixa**

## O que ainda não está nesta etapa

- Emissão de nota fiscal
- Conciliação financeira automática
- Multiempresa completo (a base já está preparada, mas não está ativado)
- Estorno automático de Pix/cartão (fica marcado como pendente pra fazer manual)
