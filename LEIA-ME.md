# Estoque Mercadinho — Pacote 8: painel inicial no computador

## Nada pra configurar
Sem mudança de banco. Só subir no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## O celular continua intacto
Como sempre: conferi automaticamente e o que o celular renderiza é idêntico ao
de antes. A tela inicial do celular nem passa pelo código novo — ele fica num
componente separado que só é usado acima de 1024px.

---

## A tela inicial virou um painel

Aquele vazio no computador foi preenchido com informação útil, toda ela vinda
de dados que o sistema já tinha.

### Botão "Nova venda" em destaque
Grande, no topo à direita, com brilho ciano. É a primeira coisa que chama
atenção. O "Sair" foi pra barra do topo, discreto, pra não competir.

### Os quatro números, agora numa linha só
E com contexto embaixo de cada um:
- **Total vendido** — com a comparação com ontem (↑ ou ↓ em %)
- **Lucro** — mostrando quanto foi descontado de taxa
- **Vendas hoje** — com o ticket médio
- **Estoque baixo** — clicável, leva pra Produtos

### Gráfico dos últimos 7 dias
Barras com o faturamento de cada dia. Hoje aparece destacado em ciano. Passando
o mouse, mostra o valor exato.

### Últimas vendas
As 5 últimas de hoje, com hora e o que foi vendido. Clicando, abre o detalhe.

### Caixa
Saldo em dinheiro do caixa aberto e a hora que foi aberto. Se não tiver caixa
aberto, vira um aviso com botão pra abrir.

### Como pagaram hoje
Barras proporcionais por forma de pagamento.

### Precisa repor
Lista dos produtos com estoque baixo, clicáveis — vão direto pra tela do
produto, onde tem o "Chegou mercadoria".

### Barra de navegação
Ganhou o item **Início** no começo. O destaque da seção atual agora funciona
certo — na tela inicial, "Início" fica marcado.

---

## Roteiro de teste

1. Abre **no computador** — a tela inicial deve estar cheia de informação
2. Confere se "Início" está destacado na barra do topo
3. Vê se o gráfico dos 7 dias mostra as barras (hoje em ciano)
4. Clica numa das últimas vendas — deve abrir o detalhe
5. Clica num produto em "Precisa repor" — deve abrir a tela dele
6. Clica em "Nova venda" — deve ir pra tela de venda
7. **Abre no celular** e confirma que a tela inicial está como sempre foi
