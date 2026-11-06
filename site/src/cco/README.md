# Origem dos componentes CCO

Referência autorizada: `C:/Projetos/EscalaCCO-front`. Revisão em 05/11/2026. O repositório original não foi modificado.

| Destino | Origem e adaptação |
| --- | --- |
| `NavBar.css` | Removido em 06/11/2026: a navegação passou para o cabeçalho e os estilos estão em `../design.css` |
| `NavBar.jsx` | Classes do NavBar original, destinos Mapa/Linhas/Favoritos como abas do cabeçalho (barra inferior no celular), sem menus administrativos ou autenticação |
| `Campos.css` | `src/styles/Campos.css`, incluindo select nativo estilizado e scrollbar |
| `components/Form/SelectBusca.*` | Componentes originais importados diretamente em React |
| `components/Paginacao/*` | Paginação original importada diretamente em React |
| `components/PainelLateral/*` | Painel e CSS originais; adicionados contenção de foco e fundo inerte durante abertura |
| `components/Toast/*` | Toast e CSS originais; adicionados anúncio acessível e rótulo do botão fechar |
| `ThemeContext.jsx` | Contexto original adaptado para dois temas, verde fixo e preferência local do UniRide |
| `ErrorBoundary.jsx` | Padrão de captura de falhas da interface do CCO |

`../MapView.jsx` usa Leaflet/React-Leaflet, organização de camadas e barra de controles do MapPage do Escala. As camadas e a consulta de transporte foram reimplementadas para a API pública. Não foi copiada a página operacional de AVL com permissões, empresas, veículos internos ou WebSocket.

`../../server/cache.js` adapta o padrão do backend `services/cache_mapa.py` (validade, deduplicação de carga e último snapshot) para o runtime Worker, sem Redis. A validação da idade das posições segue o cuidado observado em `services/monitoramento_avl.py`, com contrato específico da SEMOB.

Não foram importados tokens, sessões, credenciais, dados operacionais, permissões, frota ou código de integrações privadas. Os detalhes de escopo estão em `../../docs/DIAGNOSTICO.md`.
