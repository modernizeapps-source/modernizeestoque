# Estoque Mercadinho — Pacote 5

## Nada pra configurar
O banco já foi atualizado. Só subir no GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## Pix nas maquininhas

Muitas maquininhas também recebem Pix, com taxa própria — diferente do Pix que
cai direto na sua chave. Agora o sistema separa os dois.

### No cadastro da maquininha (Configurações)
Passou a ter três campos, lado a lado:

    NOME DA MAQUININHA
    [ InfinitePay                    ]

    CRÉDITO %    DÉBITO %    PIX %
    [  3,50  ]   [  1,50  ]  [ 0,80 ]

Se a maquininha não recebe Pix, deixe 0.

### Na hora da venda
Ao escolher **Pix**, aparecem botões pra dizer onde o dinheiro vai cair:

    ONDE VAI RECEBER
    [ Minha chave ]  [ InfinitePay ]  [ Cielo ]

"Minha chave" vem primeiro por ser o mais comum. Se nenhuma maquininha estiver
cadastrada, essa pergunta nem aparece — vai direto pra tela de confirmação,
como era antes.

O texto da tela muda conforme a escolha: "Mostre sua chave Pix pro cliente" ou
"Gere a cobrança Pix na maquininha".

### No lucro
Cada Pix desconta a taxa certa: a da maquininha escolhida, ou a taxa geral de
Pix (em Configurações) quando cai na sua chave.

---

## Roteiro de teste

1. **Configurações** → edita uma maquininha e coloca uma taxa de Pix (ex: 1%)
2. **Venda** → finaliza no Pix e confere se aparecem os botões de destino
3. Escolhe "Minha chave", confirma, e vê o lucro nos relatórios
4. Faz outra venda igual, mas escolhendo a maquininha
5. Compara: a segunda deve ter descontado 1% a mais

---

## Ainda pendente

- **Conciliação financeira**: comparar vendas com o que a maquininha repassou
- **Nota fiscal** e **multiempresa**: só se/quando precisar
