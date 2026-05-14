# Home com vitrine de coleção no topo

**Data:** 2026-05-13
**Escopo:** substituir a seção principal focada só no MB-1572S por uma vitrine com os três modelos à venda.

## O que mudou

1. A home em [src/app/_landing/LandingClient.tsx](src/app/_landing/LandingClient.tsx) deixou de abrir com o hero de produto único.
2. A seção "Nossa Coleção / Três modelos, um propósito" foi promovida para o topo da página, logo abaixo da navegação.
3. Os dados dos cards foram centralizados em uma constante `catalogModels`, evitando duplicação de markup e mantendo os links para `/produto/mb-1572s`, `/produto/viking` e `/produto/presence`.
4. A coleção duplicada mais abaixo da landing foi removida.

## Resultado esperado

- A primeira dobra da home passa a mostrar os três modelos lado a lado, no estilo do layout de referência.
- O usuário consegue comparar medidas e clicar direto em qualquer PDP sem passar por um hero de modelo único.
- O CTA de lista de espera continua disponível em cada card e no restante da página.

## Validação

1. Rodar `npm run build`.
2. Abrir a home e confirmar desktop + mobile.
3. Validar que os três cards apontam para os slugs corretos de produto.