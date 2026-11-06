> Registro da primeira integração. A revisão seguinte amplia a cobertura e aplica as heurísticas: consulte [NIELSEN.md](NIELSEN.md) e [COBERTURA.md](COBERTURA.md) para o estado atual.

Atualização de 05/11/2026: a consulta online agora parte da localização do usuário. Paradas são próximas da origem; linhas passam perto da origem e do campus. Veja [fluxo e limites de localização](ORIGEM.md).


# Diagnóstico do UniRide e reaproveitamento do Escala

Revisão de 05/11/2026. A análise inventariou a estrutura e os módulos do frontend/backend e leu as implementações candidatas ao reaproveitamento. Não equivale a uma auditoria linha a linha, de segurança integral ou de produção do Escala.

## Resultado implementado

A interface deixou a estrutura de página promocional e passou a uma área de consulta: navegação lateral compacta, seleção de campus, lista com paginação e mapa ocupando a área principal. São componentes React do próprio Escala, com adaptações documentadas em `src/cco/README.md`. O verde é fixo; o usuário muda somente claro/escuro. Não há vagas ou reservas.

A aplicação agora consulta a SEMOB/DF de verdade, sem chave. Foram implementados catálogo por campus, traçados, paradas da região, horários programados e posições recentes. O backend mínimo roda tanto no Node local quanto no Worker da hospedagem. O material para apresentação continua como um HTML independente, com amostra datada e explicitamente limitada.

## Estrutura analisada

**EscalaCCO-front:** React, Vite, React Router, axios, Leaflet/React-Leaflet, react-icons, gráficos, calendário e animações. Módulos: Dashboard, Map, Escala, Justificativa, User, Aferição, Troca, Frota/manutenção/AVL/OS/documentos, Ocorrências, Matriz, Contratos e Relatórios. Componentes de navegação, formulário, paginação, toast, modal/painel, contextos de tema/autenticação e hooks de fila, rascunho e WebSocket foram classificados pelo uso no passageiro.

**EscalaCCO:** FastAPI, SQLAlchemy/PostgreSQL, Alembic e Redis. Rotas/serviços de autenticação, usuários, empresas, linhas, rotas, escalas, parciais, justificativas, relatórios, ocorrências, frota e importações. Integrações Google Sheets/Drive, Mobilibus/Mobility; serviços de cache do mapa, monitoramento AVL, snapshots, auditoria, filas e permissões. Modelos associam usuários, perfis, empresas, contratos, escalas, substituições e dados operacionais.

## Decisões de reaproveitamento

| Parte do Escala | Decisão no UniRide | Motivo |
| --- | --- | --- |
| NavBar, Campos, SelectBusca, Paginacao, Toast, PainelLateral | Importados/adaptados | Consistência visual e componentes funcionais existentes |
| ThemeContext e ErrorBoundary | Adaptados | Tema binário e falhas tratadas sem dependência de autenticação |
| MapPage e controles de mapa | Padrões, bibliotecas e classes reaproveitados | Mapa do passageiro precisa de camadas públicas e ações simples |
| `services/cache_mapa.py` | Padrão adaptado para cache em memória | Evita repetir consultas e permite indicar último resultado válido |
| `services/monitoramento_avl.py` | Cuidado com idade da posição reaproveitado | GPS antigo não deve aparecer como atual |
| Tratamento de datas de Brasília e erros de API | Adaptados ao contrato público | Calendário local e mensagens compreensíveis |
| Auth, usuários, roles, empresas e permissões | Não importados | Consulta pública não precisa das contas e privilégios do CCO |
| Escalas de motoristas, frota, manutenção, ocorrências, contratos e relatórios | Não importados | Gestão operacional fora do escopo do passageiro |
| Google/Sheets/Drive, Mobilibus/Mobility e WebSocket operacional | Não importados | Dependem de credenciais/contratos/dados da operação; não são API pública gratuita |
| Redis/PostgreSQL/Alembic e filas | Adiados | Sem registros transacionais nesta versão; crescer só quando houver necessidade concreta |
| Modal, gráficos, datepicker complexo e animações | Não necessários nesta tela | Select/data nativos, painel lateral e mapa já resolvem a consulta |

As rotas do backend Escala chamadas “públicas” não são necessariamente anônimas: `routers/api_publica.py` verifica X-API-Key e `routers/rotas.py` usa usuário autenticado. Não foi tentado reaproveitar chaves ou contornar esse controle.

## API escolhida e validação

Fonte: [GeoServer SEMOB](https://geoserver.semob.df.gov.br/geoserver/web/), serviço WFS em `https://geoserver.semob.df.gov.br/geoserver/semob/ows`.

Consultas reais do adaptador em 05/11, aproximadamente 14h46, retornaram:

| Área | Linhas distintas a até 1 km do traçado | Paradas a até 1 km |
| --- | ---: | ---: |
| UnB, referência ICC Norte | 63 | 36 |
| UniCEUB Asa Norte | 110 | 10 |
| UniCEUB Taguatinga | 192 | 38 |

Contagens são a fotografia da consulta, não promessas de catálogo fixo. O BBOX inicial é refinado pela distância aos segmentos da geometria, evitando linhas selecionadas apenas pelo envelope. A linha 0.110 retornou 1 traçado, 285 registros de grade e, naquela consulta, 8 posições recentes e 2 descartadas. Os registros da grade são filtrados por data/vigência/dia da semana; 285 não significa 285 saídas todos os dias.

A fonte não enviou CORS, então o navegador chama o proxy do próprio UniRide. A URL e camadas são fixas, números de linha são validados, há timeout, cache e deduplicação. Cada posição é validada pelas coordenadas e idade de `datalocal`; `dataregistro` não é usado para fingir atualidade. IMEI não é solicitado nem exposto.

## O que falta ou depende de confirmação externa

1. **Previsão de chegada por parada:** não localizada na fonte testada. A tela mostra partida programada na origem; não calcula um ETA fictício.
2. **Planejamento porta a porta, baldeações e associação parada–linha:** a proximidade geométrica não basta. Requer feed com relações/calendário confiáveis e motor de planejamento, ou contrato de API adequado. Não foi validado GTFS atual do DF.
3. **Feriados/exceções de operação:** máscara semanal e vigência estão implementadas, mas não há calendário de exceções validado. A interface informa essa limitação.
4. **Cobertura e estabilidade do GPS:** depende da SEMOB. Sem registro recente, aparece “sem posição recente”; a aplicação não simula veículos. O fuso -03 de `datalocal` foi inferido de amostras consistentes com Brasília e deve ser confirmado com o provedor.
5. **Entradas dos campi:** UnB usa referência publicada do ICC Norte; CEUB Asa Norte é aproximação geográfica e Taguatinga usa referência do link oficial próxima ao campus. Não prometem localização exata de portarias/acesso a pé.
6. **Escala de uso e garantia:** acesso anônimo sem chave e metadados sem taxas foram confirmados, mas não foi encontrada quota/SLA/licença padronizada. Para serviço público amplo, confirmar termos com SEMOB, planejar cache compartilhado/limite de requisições e monitoramento. O cache atual é por processo, não persistente.
7. **Conta e sincronização de favoritos:** ficam somente no navegador; backend de usuário ainda não é necessário ao fluxo atual.
8. **Arquivo de apresentação:** oferece amostra real datada (0.110, 0.011, 0.018, 0.008). A integração atual e o mapa-base precisam da versão online ou servidor Node. Não é possível executar um proxy HTTP com dois cliques em HTML.

## Verificação

Sete testes automatizados cobrem distância real ao trajeto, GPS antigo/inválido/futuro, fuso, calendário/vigência, deduplicação/cache e rejeição de consultas inválidas ao proxy. Build do HTML e contrato ESM `default.fetch` do Worker validados. As respostas reais das três áreas e da linha 0.110 foram verificadas. Verificação visual contempla mapa e consulta, troca de campus, tema, favoritos e layout de celular.

Detalhes de pesquisa, schemas e referências: [API-SEMOB.md](API-SEMOB.md). O material bruto de verificação está em `C:/Projetos/UniRide/research/`. Nenhum dos repositórios Escala foi modificado.
