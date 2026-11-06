# Aplicação das 10 heurísticas de Nielsen

Atualização de 05/11/2026: a consulta online agora parte da localização do usuário. Paradas são próximas da origem; linhas passam perto da origem e do campus. Veja [fluxo e limites de localização](ORIGEM.md).


Revisão de implementação: 05/11/2026. Referência conceitual: Jakob Nielsen, [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/), Nielsen Norman Group. A tabela registra decisões e evidências do UniRide; não é certificação de usabilidade nem substitui testes com estudantes.

| Heurística | Aplicação concreta no UniRide | Como verificar |
| --- | --- | --- |
| 1. Visibilidade do estado do sistema | Carregamento, atualização, horário da consulta, conexão perdida, fonte indisponível e dados anteriores são diferenciados. Atualização mantém a lista já recebida. Contagens e avisos usam status acessível. | Atualizar consulta; observar estado e data. Se a rede cair, ler aviso e tentar novamente. |
| 2. Correspondência com o mundo real | “Sua faculdade”, “campus”, “horários de saída” e “sentido da linha”; datas brasileiras. A interface explica que partida na origem não é chegada à parada. | Abrir uma linha e consultar a grade por data e sentido. |
| 3. Controle e liberdade | Desfazer inclusão/remoção de favoritos por 12 segundos; limpar busca; fechar painel por botão/Escape; voltar à lista preserva busca/página. Histórico do navegador acompanha campus e detalhe. | Favoritar, Desfazer; abrir linha e usar Voltar do navegador. |
| 4. Consistência e padrões | Mesmos componentes CCO para navegação, paginação, campos, painéis e avisos. Verde fixo; claro/escuro. Ícones acompanhados de nome acessível. | Navegar por Mapa, Linhas e Favoritos nos dois temas. |
| 5. Prevenção de erros | Faculdades são escolhidas de catálogo verificado; não há destino livre inventado. Backend exige campus e recusa linha fora do recorte. Data inválida recebe orientação. GPS vencido é retirado. | Consultar API sem campus; inserir linha incompatível na URL; apagar a data. |
| 6. Reconhecimento em vez de memorização | Seleção com nome, endereço, instituição e campus atual; pesquisa por sigla/região. Favoritos pertencem ao campus. Código e nome da linha permanecem no detalhe. | Buscar “Católica”, escolher campus e abrir uma linha. |
| 7. Flexibilidade e eficiência | Último campus persistente, favoritos, busca sem acentos, botão Hoje, atalho Alt+B, controles por teclado e alternância lista/mapa no celular. | Reabrir app; usar Alt+B e setas entre Linhas/Paradas. |
| 8. Estética e design minimalista | Consulta e mapa ocupam a tela; sem banners promocionais, métricas administrativas, reservas ou vagas. Fontes, cobertura e explicações extensas ficam na ajuda. | Conferir tela inicial e abrir ajuda somente quando necessário. |
| 9. Recuperação de erros | Mensagens em linguagem comum, Tentar novamente, limpar busca sem resultado, consultar hoje e retornar às linhas do campus quando o link é incompatível. Dados recebidos continuam visíveis em falha de atualização. | Buscar termo inexistente; abrir linha fora do campus; testar indisponibilidade. |
| 10. Ajuda e documentação | Painel pesquisável com passos para encontrar ônibus, interpretar horários/GPS, salvar/desfazer favoritos, recuperar conexão e usar teclado. Inclui fontes e cobertura. | Buscar “horários” ou “conexão” na ajuda. |

## Recorte universitário

A consulta inclui 14 instituições e 29 campi com referência geográfica: [cobertura e fontes](COBERTURA.md). Cada catálogo contém somente linhas com trecho a até 800 m da referência selecionada e paradas desse entorno. O mesmo recorte é exigido pelos endpoints de detalhes/posições. Proximidade não comprova atendimento a uma parada nem significa que o destino final da linha é exclusivamente a faculdade.

## Acessibilidade e verificação

Os painéis contêm o foco, deixam o restante da aplicação inerte e devolvem o foco ao controle de origem. Abas usam setas, Home/End, seleção e painel associado. Paginação identifica a página atual. Há rótulos de botões, foco visível, atalho para conteúdo e respeito à preferência por movimento reduzido. Controles principais no celular têm área de toque ampliada.

Dezessete testes automatizados cobrem calendário, geografia, validade de GPS, navegação, integridade dos campi, migração de favoritos, escopo da API e cache. Verificação visual local: abertura/fechamento do seletor, favoritos e Desfazer, histórico mantendo busca, detalhe, ajuda e responsividade. A disponibilidade da SEMOB e a distribuição dos campi foram verificadas por consultas reais.

Ainda é recomendável validar tarefas com estudantes: encontrar a faculdade, escolher a linha e interpretar a partida. Isso pode revelar dificuldades que uma inspeção do código e da interface não detecta. Não se afirma conformidade integral com WCAG, nem ausência de todos os problemas de usabilidade.
