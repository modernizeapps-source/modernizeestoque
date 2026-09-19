# Estoque Mercadinho — Pacote 2 (correções + taxas)

## Nada pra configurar desta vez

O banco de dados já foi atualizado por mim. As variáveis do Netlify continuam
as mesmas do pacote anterior — não precisa mexer em nada lá.

É só subir os arquivos no GitHub e rodar o deploy:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

## O que mudou neste pacote

### 1. Nova tela: Configurações (taxas)
Botão novo na tela inicial. Serve pra cadastrar a taxa que a maquininha/banco
cobra em cada forma de pagamento (crédito, débito, Pix...). O lucro em todos os
relatórios passa a descontar essas taxas automaticamente, mostrando quanto
realmente sobra.

Começa tudo zerado — **preencha com as taxas reais do contrato do Misa** pra
que o lucro fique correto. No card de Lucro dos relatórios aparece, em letra
pequena, quanto foi descontado de taxa no período.

### 2. Pagamento misto agora funciona
Antes, toda forma de pagamento cobrava o valor cheio da venda — na prática o
pagamento dividido não funcionava. Agora, na tela de finalizar venda, existe um
campo **"Quanto pagar agora"**: deixe vazio pra cobrar tudo numa forma só, ou
preencha um valor menor pra dividir. Depois de confirmar a primeira parte, o
sistema mostra quanto falta e você escolhe a segunda forma.

### 3. Seletor de período no Lucro por categoria
A seção agora tem um seletor próprio, pequeno, ao lado do título. Por padrão ele
acompanha o filtro do topo do relatório (fica em cinza). Se você escolher um
período ali (Esta semana / Este mês / 3 meses / 6 meses / 1 ano / datas
específicas), a seção passa a andar sozinha e o seletor fica azul. Tem a opção
"↺ Seguir o filtro do topo" pra voltar ao normal.

### 4. Seção "Produtos" removida dos relatórios
Ela mostrava mais/menos vendidos, o que a Curva ABC já faz melhor.

### 5. Texto da sangria corrigido
Antes aparecia "Estorno da venda ae102ad3-e876-..." (código interno ilegível).
Agora aparece "Estorno de venda — <motivo que você digitou>".

### 6. Correção extra que encontrei
Quando você abria o carrinho e fechava sem pagar, a venda ficava "pendurada"
no sistema como aguardando pagamento, pra sempre. Agora ela é descartada
automaticamente. (Já limpei a que tinha ficado dos seus testes.)

## Roteiro de teste

1. **Configurações** → preenche as taxas (ex: crédito 3,5 / débito 1,5) e salva
2. **Relatórios** → confere se o card de Lucro agora mostra "já sem R$ X de taxas"
3. **Relatórios** → testa o seletor pequeno do Lucro por categoria
4. **Relatórios** → confere que a seção "Produtos" sumiu
5. **Venda** → monta um carrinho, em "Quanto pagar agora" coloca menos que o
   total, paga em dinheiro, e depois completa o restante no Pix
6. **Venda** → abre o carrinho e fecha sem pagar; confere no Histórico que ela
   não ficou como "aguardando"
7. **Leitor de código de barras** (quando pegar com o Misa): conecta no USB,
   abre Nova venda e escaneia — deve avisar "código não cadastrado" com atalho
   pra cadastrar

## Ainda pendente

- **Pix automático**: depende do Misa ativar o "Checkout Integrado" no app da
  InfinitePay (aba Vendas → Checkout → Configurações)
- **Conciliação financeira**: comparar as vendas com o que a InfinitePay
  realmente repassou. Depende de saber o que a API deles oferece
- **Nota fiscal (NFC-e)** e **multiempresa**: etapas futuras
