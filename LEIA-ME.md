# Estoque Mercadinho — Pacote 13: Fase 2 + limpeza do histórico

O banco já está atualizado. Só subir no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## Histórico apagado ✓

Já limpei, conforme você pediu. Foram apagadas 32 vendas, 39 itens, 13
pagamentos, 3 sessões de caixa e as movimentações ligadas a vendas.

**Nada de estoque foi tocado** — os 11 produtos continuam com as quantidades
que o Misa ajustou na mão. Categorias, maquininhas, usuários e configurações
também ficaram intactos.

O relatório e o histórico começam do zero. Como não tem caixa aberto, o Misa
precisa abrir um antes da primeira venda.

---

## Alterar o estoque (o que você pediu hoje)

Na tela do produto, **"Estoque atual" agora é um campo editável normal**, junto
com nome e preço. Fez a contagem e deu 47 em vez de 50? Apaga, digita 47 e
salva.

Quando o número muda, aparece um aviso em amarelo mostrando de quanto pra
quanto vai, e um campo perguntando o motivo (contagem, quebra, perda). O motivo
fica registrado no histórico de movimentações.

**Isso é diferente de "Chegou mercadoria"**, que continua ali em cima:
- *Alterar o estoque* = corrigir uma contagem que não bateu
- *Chegou mercadoria* = entrada de compra, que recalcula o custo médio

---

## Corrigir o valor de abertura do caixa

Na tela do Caixa, embaixo do saldo esperado, tem o link **"corrigir o valor de
abertura"**. Digitou 1.600 e era 4.000? Corrige ali, sem precisar fechar e
reabrir o caixa.

Isso não movimenta dinheiro (não vira reforço nem sangria) — só conserta a
informação. Fica registrado com o valor antigo, o novo, o motivo, quem fez e
quando. O saldo esperado recalcula sozinho.

---

## Ordem dos cards

No computador, os quatro números agora vêm assim:

    Estoque baixo · Vendas hoje · Lucro · Total vendido

Ou seja, o **Total vendido** fica alinhado embaixo do botão "Nova venda", que
está no canto direito.

---

## Confirmação animada ao salvar

A caixa verde de confirmação agora entra com um leve movimento e o símbolo de
confirmação é **desenhado na tela** em meio segundo, em vez de ser só um ✓ de
texto. Vale em Configurações, Produtos e Categorias.

Quem tiver "reduzir movimento" ligado no sistema não vê animação.

---

## Menu de navegação fixo

**No celular:** barra nova fixa no rodapé, sempre visível durante a rolagem —
Início, Venda, Produtos, Caixa, Relatórios. O conteúdo ganhou um respiro
embaixo pra ela não cobrir botões.

**No computador:** a barra do topo agora gruda no topo ao rolar a página.

---

## Como testar

1. **Produtos** → abre um produto, muda o estoque, preenche o motivo e salva
2. **Caixa** → abre um caixa com um valor qualquer, depois usa "corrigir o
   valor de abertura" e confere se o saldo esperado mudou
3. **Início (computador)** → confere a ordem nova dos cards
4. **Configurações** → salva algo e olha a animação de confirmação
5. **No celular** → rola qualquer tela e confere a barra do rodapé
6. **Histórico e Relatórios** → devem estar zerados

---

## Ainda pendente (Fase 3)

Os itens grandes, que dependem uns dos outros:
- Três perfis de acesso: funcionário, dono, administrador (item 7)
- Dono gerenciar seus funcionários (item 15)
- Histórico de caixa por funcionário, dentro da própria tela de Caixa (item 5)
- Opção de espanhol pro funcionário (item 8)

Quando for fazer essa fase, a barra do celular passa a mostrar só as telas
que cada perfil pode acessar.
