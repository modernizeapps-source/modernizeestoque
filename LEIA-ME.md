# Estoque Mercadinho — como usar este projeto

## Correção aplicada (rodada 1 de testes)
- **Você testou**: fez login e voltou pra página inicial sem nenhum sinal de que funcionou
- **O que era de verdade**: o login estava funcionando certinho — só a página inicial não mostrava se você estava logado ou não
- **O que corrigi**: a página inicial agora mostra "✓ Você está logado como (seu e-mail)" quando o login dá certo, com um botão de Sair

## Correção aplicada (rodada 2 de testes)
- **Você testou**: testou a tela de Venda e notou que não tinha como voltar depois de entrar nela
- **O que corrigi**: adicionei uma setinha "← Voltar" no topo das telas de Venda, Produtos e Novo produto

## Novidade deste pacote: Tela de Venda
- Acesse pelo botão "Nova venda" na página inicial (depois de logado)
- Busca por nome, categorias em abas, grade de produtos
- Toca no produto pra adicionar; usa os botões "−" e "+" pra ajustar a quantidade
- A barra preta no rodapé mostra o total — toca nela pra abrir o resumo da venda
- Escolhe a forma de pagamento (Pix, Débito, Crédito, Dinheiro) e confirma
- Ao confirmar: a venda é registrada de verdade, e o estoque dos produtos já desconta sozinho

## Como testar a tela de Venda
1. Faça login e clique em "Nova venda"
2. Adicione 2 ou 3 produtos diferentes ao carrinho, ajustando quantidade em pelo menos um
3. Toque na barra do carrinho, escolha uma forma de pagamento, confirme
4. Deve aparecer "✓ Venda registrada com sucesso!"
5. Vá em "Produtos" e confira se o estoque dos produtos que você vendeu diminuiu certinho

## Novidade deste pacote: Histórico de vendas + cancelamento
- Acesse pelo botão "Histórico" na página inicial
- Lista todas as vendas, mais recentes primeiro
- Toca numa venda pra ver o "recibo" completo, com a opção de **Cancelar venda**
- Ao cancelar: os produtos voltam pro estoque, e a venda fica marcada como cancelada na lista (riscada, sem sumir)

## Novidade deste pacote: Tela Inicial com números reais
- Agora, ao logar, você já vê o resumo do dia: total vendido, lucro, número de vendas, estoque baixo e formas de pagamento — tudo vindo do banco de dados de verdade

## Novidade deste pacote: Relatórios
- Acesse pelo botão "Relatórios"
- Escolha o período: Hoje / Esta semana / Este mês
- Mostra: visão geral, total vendido por dia da semana, vendas por período do dia (com o produto campeão de cada um), lucro por categoria, produtos mais/menos vendidos, formas de pagamento
- **Ainda não incluído nesta versão**: o gráfico de evolução mês a mês de um dia da semana específico, e o fechamento por ano — ficam pra uma próxima rodada

## Como testar
1. Faça login — a tela inicial já deve mostrar os números do dia
2. Faça uma venda de teste (se ainda não tiver feito)
3. Vá em "Histórico", clique na venda que você acabou de fazer, e teste o botão "Cancelar venda" — confira se o estoque do produto voltou depois
4. Vá em "Relatórios" e confira se os números batem com o que você vendeu (troque entre Hoje/Semana/Mês pra ver se muda)

## Novidade deste pacote: melhorias no Histórico e nos Relatórios
- **Histórico**: cada venda agora mostra um resuminho pequeno dos itens (tipo "2x Cerveja, 1x Salgadinho..."), igual ao iFood — corta com "..." se ficar muito comprido
- **Relatórios**: o seletor de período agora abre um calendário de verdade (estilo Booking), com atalhos rápidos (Hoje/Esta semana/Este mês) e a opção de escolher qualquer intervalo de datas clicando no calendário
- **Relatórios**: adicionada a seção "Evolução histórica por dia" — escolha um dia da semana (Dom a Sáb) e veja um gráfico mostrando o total daquele dia mês a mês, com um resumo tipo "as segundas-feiras cresceram de X pra Y"
- **Relatórios**: adicionada a seção "Fechamento mensal" — gráfico com o total de cada mês do ano, com setinhas para navegar entre anos (‹ 2026 ›)
- Corrigida a ordem das seções nos Relatórios para: Visão geral → Total por dia da semana → Por período do dia → Evolução histórica → Fechamento mensal → Lucro por categoria → Produtos → Formas de pagamento

## Novidade deste pacote: visual futurista aplicado em todo o app
- Todas as telas (Início, Login, Venda, Produtos, Histórico, Relatórios) agora seguem o visual escuro/futurista que a gente desenhou nos mockups: fundo escuro com grade sutil, números em destaque com fonte técnica (mono), bordas finas, cores ciano/verde
- Isso é só visual — nada de funcionalidade mudou, então não deve dar nenhum erro novo

## Como testar
Dá uma passada geral em todas as telas e confere se o visual ficou parecido com a imagem futurista que a gente aprovou. Teste principalmente:
1. A tela de Login e a Inicial (com o resumo do dia)
2. A tela de Venda (cores do carrinho, botões +/-)
3. Os Relatórios inteiros, rolando até o fim

## O que já está pronto
- Página inicial simples (com botões pro login e pra tela de produtos)
- Tela de login (e-mail e senha), já conectada ao banco de dados real no Supabase
- **Tela de Produtos** — lista os produtos cadastrados, mostra aviso de estoque baixo
- **Tela de Novo produto** — cadastra produto com nome, categoria (com busca e opção de criar categoria nova na hora), preço de custo, preço de venda, estoque atual e estoque mínimo. Se cadastrar já com quantidade, isso gera automaticamente um registro de entrada no histórico.
- Banco de dados criado no Supabase com as tabelas: categorias, produtos, vendas, itens da venda e movimentações de estoque
- Segurança ativada — só quem estiver logado acessa os dados

## Como testar no seu computador

1. Extraia este arquivo .zip numa pasta do seu computador (por exemplo, `Documentos\estoque-mercadinho`).
2. Abra o **Prompt de Comando** do Windows.
3. Navegue até a pasta que você extraiu. Exemplo:
   ```
   cd Documentos\estoque-mercadinho
   ```
4. Rode este comando (só precisa fazer isso uma vez, ou quando eu adicionar algo novo):
   ```
   npm install
   ```
5. Rode este comando pra ligar o projeto:
   ```
   npm run dev
   ```
6. Abra o navegador em: `http://localhost:3000`

## Antes de testar o login: crie seu usuário

O login não funciona sozinho — primeiro você precisa criar a conta de acesso (seu e-mail e senha) direto no painel do Supabase:

1. Entre no painel do Supabase, no projeto **Estoque Mercadinho**.
2. No menu, vá em **Authentication** → **Users**.
3. Clique em **Add user** e cadastre o e-mail e senha que você vai usar pra entrar no app.
4. Pronto — agora esse e-mail/senha funcionam na tela de login do app.

## Quando quiser publicar (deixar no ar de verdade)

1. Suba a pasta inteira do projeto pro GitHub (do jeito que você já fez com o Jeri Food, arrastando pelo site).
2. Conecte esse repositório no Netlify — ele publica sozinho a cada vez que você atualizar o GitHub.
3. No Netlify, em **Site settings → Environment variables**, adicione as mesmas duas chaves que estão no arquivo `.env.local` deste projeto (isso é necessário porque o `.env.local` não vai junto quando você sobe pro GitHub, por segurança).

## Como testar a tela de Produtos

1. Faça login normalmente.
2. Acesse `http://localhost:3000/produtos` (ou clique no botão "Produtos" na página inicial).
3. Clique em "Novo produto", preencha e salve.
4. Confira se ele aparece na lista, com o preço e o estoque certos.
5. Se cadastrar uma categoria nova durante o cadastro (digitando um nome que ainda não existe e clicando em "Criar categoria..."), confira se ela aparece certinha depois.

## O que vem a seguir

O próximo pacote vai trazer a tela de Venda (o carrinho). Você só substitui/adiciona as pastas correspondentes e roda `npm install` de novo se eu avisar que adicionei algum pacote novo.
