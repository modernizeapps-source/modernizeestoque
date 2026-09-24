# Estoque Mercadinho — Pacote 16

Inclui tudo dos pacotes 14 e 15. O banco já está atualizado.
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

## Novidades deste pacote

**Unidades por fardo agora é por produto.** O campo saiu da tela de Categorias e
foi pro cadastro e edição de cada produto, logo abaixo do estoque mínimo. Uma
Heineken pode ter fardo de 12, uma Corona de 24, uma long neck de 6.

Nenhum produto tinha fardo configurado ainda, então nada se perdeu. É só abrir
cada cerveja e preencher.

**Leitor de código de barras:** bipar o mesmo produto várias vezes soma no
carrinho (3 bips = 3 cervejas), inclusive começando de outra tela. O primeiro
bip não é mais contado em dobro, e o reconhecimento aceita leitores um pouco
mais lentos.

**Menu à prova de falha:** se o perfil demorar a carregar, a barra mostra o
básico (Início, Venda, Produtos, Caixa) em vez de ficar vazia.

**Correção no banco (já aplicada):** desativar funcionário, renomear e trocar
idioma falhavam calados por falta de permissão. Resolvido.

## Como saber se subiu certo

Entre com o login do Misa. No canto direito da barra do topo deve aparecer
**"Misa"**, e no menu deve existir **Funcionários**.

---

## Três perfis de acesso (item 7)

| | Funcionário | Dono (Misa) | Admin (você) |
|---|---|---|---|
| Venda | ✓ | ✓ | ✓ |
| Caixa | ✓ | ✓ | ✓ |
| Produtos | só consulta | consulta e edita | consulta e edita |
| Relatórios | — | ✓ | ✓ |
| Configurações | — | ✓ | ✓ |
| Funcionários | — | ✓ | ✓ |
| Empresas | — | — | ✓ |

**A trava é de verdade, não só visual.** Se um funcionário digitar
/configuracoes na barra de endereço, o sistema o manda de volta pro início. O
menu também só mostra o que o perfil dele pode abrir.

O funcionário também não vê custo nem margem dos produtos — só nome, preço de
venda e estoque. E a tela inicial dele não mostra faturamento nem lucro.

---

## Funcionários (item 15) — nova tela, no menu do dono

O Misa cadastra a equipe sozinho, sem depender de você.

**Como funciona:** ele digita o nome do funcionário e o sistema gera um código
de 6 letras, tipo `K7P2M9`. Ele passa o código pra pessoa, que entra no site,
clica em "Criar conta", digita o código e **escolhe a própria senha**.

Assim ninguém precisa saber a senha do outro. O código vale 7 dias.

Na tela ele vê quem está na equipe, quantos têm acesso, e pode renomear,
desativar e reativar. **Desativar não apaga nada** — a pessoa perde o acesso na
hora, mas as vendas e caixas dela continuam no histórico com o nome dela.

---

## Troca de turno

Na tela inicial do funcionário aparece bem grande **quem está operando**, com um
botão "Trocar usuário" do lado. Na troca de turno, o próximo entra com a conta
dele ali mesmo, sem sair da tela.

Toda venda e toda abertura de caixa ficam registradas no nome de quem estava
logado.

---

## Histórico de caixa por funcionário (item 5)

Agora fica **dentro da própria tela de Caixa**, no botão "Histórico" — não é
mais outra aba nem outro item no menu.

Cada turno mostra quem abriu, os horários, o valor inicial, o esperado, o
contado e se bateu, sobrou ou faltou. Tocando no turno, abre a lista de vendas
daquele caixa com hora, quem vendeu e a forma de pagamento.

Tem o filtro **"Só dinheiro"**: mostra apenas as vendas que afetam a gaveta e
soma o total recebido em espécie. Em venda dividida, conta só a parte que foi
em dinheiro — Pix e cartão aparecem na conferência mas não entram nessa soma.

Se houver mais de uma pessoa, aparecem botões pra filtrar por funcionário.

---

## Espanhol (item 8)

Só o funcionário vê o seletor, ao lado do nome dele na tela inicial:
`Português` `Español`.

A escolha vale só pra conta dele — não muda nada pros outros. Traduz as telas
que ele usa (venda, caixa, produtos, navegação). **Nomes de produtos e
categorias nunca são traduzidos**, porque são dados da loja.

---

## Adicionar categoria no cadastro do produto

Ao escolher a categoria de um produto, agora tem o botão **"+ Adicionar
categoria"** sempre visível no topo da lista. Antes só aparecia se você digitasse
um nome inexistente — tinha que adivinhar.

---

## Primeiro teste, na ordem

1. **Entre como o Misa** (maresiaconveniencia23@gmail.com)
2. Vá em **Funcionários** e cadastre alguém de teste
3. Copie o código gerado
4. **Abra outra janela** (anônima, pra não deslogar), vá no site, clique em
   "Criar conta", use o código e crie uma senha
5. Veja que essa conta cai numa tela simples: só Nova venda, Caixa e Produtos
6. Tente abrir **/configuracoes** na barra de endereço — deve voltar pro início
7. Faça uma venda por essa conta
8. Volte na conta do Misa → **Caixa → Histórico** → o turno deve mostrar o nome
   de quem operou e a venda dele
9. Na conta do funcionário, troque pra **Español** e confira as telas

---

## Uma observação

O Misa é `owner` e você é `admin`. Como as duas contas já existiam antes desse
pacote, elas continuam funcionando igual — só ganharam os poderes novos.

O login antigo (gmotamaia) continua sem perfil, então não vai conseguir entrar
em lugar nenhum. Use o modernizeapps.
