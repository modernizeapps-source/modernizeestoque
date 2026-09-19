# Estoque Mercadinho — Pacote 4 (corrigido)

> Se você tentou subir a versão anterior deste pacote e o deploy falhou com
> "Cannot find name 'setQrCodeUrl'", era um erro meu: sobraram três linhas do
> Pix automático que eu havia removido. Já está corrigido aqui.

## Nada pra configurar
O banco já foi atualizado. Só subir no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## 1. Pix automático removido

O QR Code da InfinitePay abria um checkout de loja online no navegador, pedindo
nome, e-mail e telefone do cliente — inviável pro balcão. Foi removido.

Ficaram três formas: **Dinheiro**, **Pix** (você mostra sua chave e confirma
quando cair) e **Cartão**.

---

## 2. Maquininhas com taxa própria

Em **Configurações** agora você cadastra as maquininhas que usa, cada uma com a
taxa dela:

    InfinitePay    crédito 3,50%  ·  débito 1,50%
    Cielo          crédito 4,00%  ·  débito 2,00%

Na hora da venda com cartão, aparecem botões pra escolher qual maquininha foi
usada e se foi crédito ou débito. Dois toques, sem digitar nada. O lucro desconta
a taxa daquela maquininha específica.

**Dica:** se a sua maquininha cobra diferente por bandeira, cadastre como opções
separadas ("Cielo Visa", "Cielo Master").

Ao remover uma maquininha, as vendas antigas continuam intactas no histórico —
ela só some da tela de venda.

---

## 3. "Cartão (maquininha)" virou só "Cartão"
Nos relatórios e no histórico. Vendas antigas com "débito"/"crédito" aparecem
como "Cartão (débito)" e "Cartão (crédito)".

---

## Primeira coisa a fazer depois do deploy

1. Vá em **Configurações**
2. Cadastre as maquininhas do Misa com as taxas reais do contrato dele
3. Se o banco cobrar algo por Pix recebido, preencha embaixo (senão deixe 0)

Sem maquininha cadastrada a venda funciona normal, mas o lucro não desconta taxa
de cartão — a tela avisa quando isso acontece.

---

## Roteiro de teste

1. **Configurações** → cadastra duas maquininhas com taxas diferentes
2. **Venda** → finaliza no cartão e confere se aparecem os botões das duas
3. Escolhe uma, marca Crédito, confirma
4. **Relatórios** → confere se o lucro descontou a taxa daquela maquininha
5. Repete com a outra maquininha e compara a diferença
6. **Configurações** → edita a taxa de uma e vê o lucro mudar nos relatórios
7. **Venda** → confere que "Pix automático" não aparece mais

---

## Ainda pendente

- **Leitor de código de barras**: você ainda não testou
- **Conciliação financeira**: comparar vendas com o que a maquininha repassou
- **Nota fiscal** e **multiempresa**: só se/quando precisar
