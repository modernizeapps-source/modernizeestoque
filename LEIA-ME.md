# Estoque Mercadinho — Pacote 3

## Nada pra configurar

O banco já foi atualizado por mim. As variáveis do Netlify continuam as mesmas.
É só subir os arquivos no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## 1. Editar produtos (o principal desta entrega)

Agora dá pra clicar em qualquer produto na lista e abrir a tela dele. Lá você vê
estoque atual, quanto compra, quanto vende e a **margem de lucro**, e pode:

### "Chegou mercadoria" — o uso do dia a dia
Você digita quantas unidades chegaram e quanto pagou por unidade. O sistema
soma ao estoque e **recalcula o custo médio sozinho**.

Exemplo real: você tem 20 Coronas que custaram R$ 3,00 e chegam 50 a R$ 2,50.
O sistema mostra na hora, antes de confirmar:

    Estoque: 20 → 70
    Custo médio: R$ 3,00 → R$ 2,64

Por que R$ 2,64? Porque você gastou R$ 60 nas primeiras 20 e R$ 125 nas outras
50 — total R$ 185 para 70 unidades. Esse é o custo real de cada garrafa que
você tem hoje. Assim o lucro nos relatórios fica correto.

### Editar dados
Nome, categoria, código de barras, preço de venda e estoque mínimo.

### Correção manual (link discreto no fim da página)
Para quando a contagem da prateleira não bate com o sistema (pede o motivo, que
fica registrado), ou pra consertar um erro de digitação no custo. Para mercadoria
nova use sempre "Chegou mercadoria", que calcula o custo médio sozinho.

### Na listagem
Agora cada produto mostra também o custo e a margem de lucro, além do preço de venda.

---

## 2. Campo de bandeira removido
Na venda com cartão, sumiu o campo "Bandeira" — ficou só Crédito/Débito, que é o
que realmente afeta a taxa e o lucro.

---

## 3. O que já veio no pacote anterior
(caso você ainda não tenha testado tudo)

- Tela de **Configurações** com as taxas por forma de pagamento
- **Pagamento misto** funcionando (campo "Quanto pagar agora")
- **Seletor de período** próprio no Lucro por categoria
- Seção "Produtos" removida dos relatórios (a Curva ABC já cobre)
- Texto da sangria corrigido

---

## Roteiro de teste

1. **Produtos** → clica num produto → confere se abre a tela nova com margem
2. **"Chegou mercadoria"** → digita 50 unidades a R$ 2,50 e confere se a prévia
   do custo médio aparece antes de confirmar
3. Confirma e vê se o estoque e o custo atualizaram
4. **Editar dados** → muda o preço de venda e salva
5. **Correção manual** → muda o estoque pra um número diferente, coloca um
   motivo e aplica
6. **Venda com cartão** → confere se o campo de bandeira sumiu
7. **Leitor de código de barras** (quando pegar): conecta no USB, abre Nova
   venda e escaneia

---

## Ainda pendente

- **Pix automático**: esperando o Misa ativar o "Checkout Integrado" no app da
  InfinitePay (aba Vendas → Checkout → Configurações)
- **Conciliação financeira**: depende de saber o que a API da InfinitePay oferece
- **Nota fiscal (NFC-e)** e **multiempresa**: etapas futuras
