# Estoque Mercadinho — Pacote 11: logins separados (admin e Misa)

## O banco já está pronto
Já criei a estrutura no banco e liguei os dois usuários que você cadastrou:
- **modernizeapps@gmail.com** → você (administrador)
- **maresiaconveniencia23@gmail.com** → Misa (dono da loja)

Só falta subir o código e testar.

**Netlify → Deploys → Trigger deploy → Deploy project without cache**

---

## O que muda

### Dois tipos de login
- **Você (admin):** ao entrar, cai numa área "Modernize Admin" com a lista de
  empresas. Clica em "Mercadinho do Misa → Acessar" e usa o sistema normalmente.
  Aparece uma faixa azul no topo lembrando que você está no modo administrador,
  com um link "trocar empresa" pra voltar à lista.
- **Misa (owner):** ao entrar, vai direto pro sistema, como sempre. Nunca vê a
  área administrativa. Se ele digitar /admin na URL, é mandado de volta.

### Você não precisa mais da senha do Misa
Com seu login de admin, você entra na loja dele pra testar e dar suporte. E ele
continua com a conta própria.

### Proteção de acesso
Adicionei uma trava central (middleware): quem não estiver logado é mandado pro
login antes de qualquer tela abrir — não aparece mais tela quebrada.

### Preparado pro futuro (sem complicar agora)
O banco já tem as tabelas `empresas` e `perfis`, e todos os dados atuais já estão
marcados como do "Mercadinho do Misa". Quando entrar o segundo cliente, é só
criar a empresa nova e o login dele — a lista de empresas no seu admin cresce
sozinha. A separação completa dos dados por empresa fica pra esse momento, como
combinado.

---

## Como testar

1. **Entra com modernizeapps@gmail.com** (sua senha de admin)
   - Deve cair na tela "Modernize Admin" com "Mercadinho do Misa"
   - Clica em Acessar → entra no sistema, com a faixa azul no topo
2. **Sai, e entra com maresiaconveniencia23@gmail.com** (senha do Misa)
   - Deve ir direto pro sistema, sem faixa azul, sem área de admin
3. Logado como Misa, tenta abrir a URL /admin na mão → deve voltar pro sistema
4. Sai e tenta abrir /produtos sem estar logado → deve ir pro login

O seu login antigo (gmotamaia) não foi apagado, mas não tem perfil ligado —
melhor não usar ele daqui pra frente. Use o modernizeapps.

---

## Ainda pendente
- Separação real dos dados por empresa: só quando vier o segundo cliente
- Nota fiscal: se um dia precisar
