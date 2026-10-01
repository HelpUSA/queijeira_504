# Queijeira 504 - Website & Cardápio Digital

Este projeto é uma réplica completa, moderna e autônoma do site/cardápio da **Queijeira 504** (`queijeira_504.helpusbr.com`), extraído de `https://app.cardapioweb.com/queijeira_504`.

## 📁 Estrutura de Arquivos

```
queijeira_504/
├── index.html              # Página principal (Single Page Application com Vue 3 & Tailwind)
├── data.js                 # Dados completos da loja (Perfil, Categorias, Produtos, Opções) em objeto global
├── data.json               # Dados brutos em formato JSON
├── README.md               # Documentação do projeto
└── assets/
    ├── css/
    │   └── style.css       # Estilos customizados (Padrão visual CardapioWeb e Queijeira 504)
    ├── js/
    │   └── app.js          # Lógica reativa da aplicação (Carrinho, Modais, Busca, Pedido via WhatsApp)
    └── images/             # 302+ Imagens baixadas localmente (Logo, Capa, Imagens dos Produtos)
```

## ✨ Funcionalidades Implementadas

1. **Cabeçalho & Informações da Loja:**
   - Foto de capa e logo oficial da Queijeira 504.
   - Status de funcionamento automático (Aberto / Fechado) baseado nos horários reais de atendimento.
   - Modal com endereço completo em Tambaú (João Pessoa - PB), mapa, horários e formas de pagamento aceitas.

2. **Navegação & Busca de Produtos:**
   - Barra de busca instantânea que filtra por nome do produto ou descrição.
   - Barra de navegação por abas fixas com rolagem suave entre as **28 categorias** e **228 produtos**.

3. **Catálogo & Cards de Produtos:**
   - Exibição em grid/cards com foto local, selos/badges ("Novo", "Destaque", "Promoção"), preços formatados em R$.

4. **Modal de Detalhes do Produto:**
   - Seleção de adicionais e opções/sabores (ex: escolha de queijos, geleias, cafés, alfajores).
   - Campo para observações personalizadas (ex: fatiar fino, embalar para presente).
   - Ajuste de quantidade e cálculo automático em tempo real do preço total.

5. **Carrinho de Compras Interativo & Checkout:**
   - Botão flutuante inferior com total de itens e valor.
   - Modal/Drawer de sacola para alteração de quantidades e tipo de pedido (Entrega ou Retirada na Loja).
   - Cálculo de taxa de entrega e subtotal.
   - Formulário de checkout com endereço completo e forma de pagamento (Pix, Dinheiro com troco, Cartão na entrega).

6. **Envio de Pedido para o WhatsApp Oficial:**
   - Formatação profissional do texto do pedido.
   - Redirecionamento direto para o WhatsApp oficial da Queijeira 504 (`(83) 99306-4658` / `5583993064658`).

## 🚀 Como Executar / Publicar

Para publicar no subdomínio `queijeira_504.helpusbr.com`, basta enviar o conteúdo desta pasta `queijeira_504/` para o servidor web ou serviço de hospedagem estática (Apache, Nginx, Vercel, Netlify, Cloudflare Pages, etc.).

Para rodar localmente no computador:
```bash
python -m http.server 8080
```
Acesse `http://localhost:8080` no navegador.
