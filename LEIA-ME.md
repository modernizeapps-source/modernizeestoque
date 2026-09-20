# Estoque Mercadinho — Pacote 10

## Nada pra configurar
Sem mudança de banco (a configuração usa a tabela que já existia). Só subir no
GitHub e rodar:
**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## Volta pro início por inatividade (no lugar do retorno automático)

**Desfiz o comportamento do pacote anterior.** Ao concluir uma venda, o sistema
agora limpa o carrinho e **fica na tela de venda**, pronto pro próximo cliente —
sem atrapalhar a fila.

Quem leva de volta pra tela inicial é o tempo de inatividade: se ninguém mexer
no sistema por X minutos, ele volta sozinho. Qualquer clique, leitura de código
de barras, digitação ou rolagem reinicia a contagem, então isso nunca interrompe
alguém no meio de uma venda.

Vale em todas as telas (Venda, Produtos, Caixa, Histórico, Relatórios,
Configurações).

### Navegar entre telas reinicia a contagem
Se ele estiver em Relatórios e clicar em Venda, o clique conta como atividade e
a contagem começa de novo dali. Ficando parado na tela de Venda, o tempo corre
normalmente até voltar pro início.

### Mudar o tempo vale na hora
Alterou de 5 pra 10 minutos em Configurações? Passa a valer na próxima tela que
abrir, sem precisar recarregar a página.

### Conta mesmo com a aba em segundo plano
Se ele trocar de aba, minimizar a janela ou sair pra fumar um cigarro, **o tempo
continua correndo**. Ao voltar pro sistema depois do prazo, já encontra a tela
inicial.

Isso exigiu um cuidado extra: navegadores congelam cronômetros de abas que estão
em segundo plano, pra economizar bateria. Então, em vez de um cronômetro comum,
o sistema anota a hora da última vez que alguém mexeu e compara com a hora atual
sempre que a aba volta a ficar visível. Assim o tempo conta de verdade, mesmo com
o computador em espera.

### Onde configurar
Em **Configurações**, na primeira seção da tela: *"Voltar para o início sozinho"*.

Tem botões prontos — **Nunca · 3 · 5 · 10 · 15 · 30 min** — e um campo livre
abaixo, caso queira um tempo específico (7 minutos, por exemplo).

**Nunca** desliga o comportamento por completo. Se não gostarem, é só marcar
essa opção, sem precisar de pacote novo.

Já deixei **5 minutos** configurado como ponto de partida. O Misa pode ir
testando e mudando até achar o tempo certo.

---

## Roteiro de teste

1. **Configurações** → confere a seção nova no topo; escolhe 3 min e salva
2. Vai pra **Produtos** e deixa a tela parada
3. Depois de 3 minutos sem tocar em nada, deve voltar sozinho pro início
4. Repete, mas mexendo o mouse de vez em quando — **não** pode voltar
5. Abre o sistema, troca pra outra aba, espera o tempo passar e volta — deve
   estar na tela inicial
6. Faz uma venda até o fim — deve ficar na tela de venda, com o carrinho limpo
7. Volta em Configurações e marca **Nunca** pra desligar, se preferir

---

## Uma coisa pra conferir

Quando trocamos as taxas de cartão para ficarem por maquininha, aquela taxa de
10% que você tinha colocado pra teste deixou de valer. Agora a taxa de cartão
vem da maquininha escolhida na venda.

Se ainda não cadastrou nenhuma maquininha em Configurações, o lucro não está
descontando taxa de cartão nenhuma. Vale cadastrar com as taxas reais do Misa.
