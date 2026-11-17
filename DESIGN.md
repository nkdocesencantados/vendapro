# DESIGN.md — identidade visual do VendaPro

Direção: profissional, tecnológica, discreta. Nada infantil. Fundo grafite escuro, vidro sutil, uma única cor de destaque que o cliente escolhe.

## Cores
- Fundo `#08090B`, superfície `#101216`, superfície 2 `#14171C`, borda `#1F232B` / forte `#2B313B`.
- Texto `#EDEFF2`, texto suave `#9AA1AD`, texto discreto `#6F7782`.
- Destaque = `--brand` da paleta ativa. Padrão **Verde Haux** `#2DBE60` (deep `#0B3A1F`, glow `#7EE8A8`).
- Opções de tema no login: Verde Haux, Azul, Violeta, Âmbar, Índigo. Nas Configurações há todas as paletas.
- Texto sobre botão de destaque: `#05070A`.

## Tipografia
- Títulos: Plus Jakarta Sans 800, espaçamento negativo.
- Texto: Inter.
- Números, rótulos e legendas técnicas: JetBrains Mono, rótulos em maiúsculas com `letter-spacing` ~.1em.

## Componentes
- Cartões de vidro: `linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))`, borda `rgba(255,255,255,.09)`, raio 16px.
- KPI: linha fina de destaque no topo com brilho; número em mono.
- Botão primário: cor de destaque com brilho suave. Secundário: contorno.
- Menu ativo: barra de 3px à esquerda.
- Badge "SISTEMA ONLINE" com ponto pulsante.
- Gráfico de barras com a barra mais recente em destaque.

## Login
Esquerda: formulário e "Cor do tema". Direita: emblema Haux no centro, três anéis em órbita com pontos viajando, painéis de vidro flutuantes (venda, faturamento, caixa conciliado), linha de varredura. Tudo em CSS 3D; respeita `prefers-reduced-motion`. No celular a cena vai para o topo e os painéis somem.

## Resumo (dashboard)
Pouca informação, em ordem: 4 indicadores, meta do mês, vendas por dia, "Precisa de atenção", últimas vendas. Botão **Personalizar** liga/desliga blocos (por usuário). **Exportar** leva a Relatórios (Excel e PDF). Detalhes (ranking, produtos, pagamentos, horários) ficam em Relatórios.

## Regras
- Uma cor de destaque por vez; o resto é neutro.
- Contraste mínimo AA; foco visível; animações desligam com movimento reduzido.
- Layout responsivo: grades caem para 2 colunas e depois 1.
- Logo: só o emblema Haux ao lado de "VendaPro". Não escrever "por HAUX WEB".
