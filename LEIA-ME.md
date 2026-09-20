# Estoque Mercadinho — Pacote 6: tela de venda no computador

## Nada pra configurar
Nem banco de dados dessa vez. Só subir no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## O celular não mudou

Antes de qualquer coisa: **o layout do celular está intacto.** Comparei o código
antigo com o novo caractere por caractere e são idênticos.

Como funciona: o sistema mede a largura da tela quando a página carrega. Abaixo
de 1024px (celular e tablet), ele usa o código de sempre, sem nenhuma alteração.
Acima disso, usa o layout novo. Não é uma adaptação do celular — são dois
layouts independentes.

---

## O que tem de novo no computador

### Barra de navegação no topo
Venda · Produtos · Caixa · Histórico · Relatórios · Configurações, sempre
visíveis. A seção atual fica destacada em ciano. À direita, o status do caixa
com um ponto verde.

Por enquanto ela aparece só na tela de Venda — as outras telas entram no
próximo pacote.

### Carrinho fixo à direita
Saiu a gaveta que subia do rodapé. Agora o carrinho é uma coluna fixa ao lado,
sempre visível, acompanhando a rolagem. Dá pra ver o que já foi escaneado sem
perder os produtos de vista.

### Produtos em grade larga
Em vez de 2 por linha, o computador encaixa quantos couberem na largura da tela
(normalmente 4 a 6). Cada card mostra também quantas unidades tem em estoque, em
amarelo quando está baixo. Clicar no card adiciona ao carrinho.

### Pagamento sem janela flutuante
As formas de pagamento e a confirmação acontecem no próprio painel da direita.
O troco aparece numa faixa verde destacada, em letra grande.

### Atalhos de teclado
- **Enter** — finaliza a venda (quando tem item no carrinho)
- **Esc** — limpa o carrinho, ou volta um passo se estiver no pagamento

Os atalhos não disparam enquanto você digita num campo, e não conflitam com o
leitor de código de barras.

---

## Roteiro de teste

1. Abre o site **no computador**, em tela cheia
2. Confere a barra de navegação no topo e o carrinho à direita
3. Escaneia ou clica em alguns produtos — devem aparecer no painel da direita
4. Aperta **Enter** — deve abrir o pagamento no mesmo painel
5. Escolhe Dinheiro, digita um valor maior — o troco aparece em verde
6. Confirma e vê se a venda fecha normalmente
7. Aperta **Esc** com itens no carrinho — deve limpar
8. **Abre o site no celular** e confirma que está exatamente como antes

---

## Próximo passo

As outras telas (Produtos, Caixa, Histórico, Relatórios, Configurações) ainda
usam o layout estreito no computador. Se você gostar do resultado da Venda, faço
todas de uma vez no próximo pacote.
