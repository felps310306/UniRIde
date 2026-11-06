# UniRide · Brasília

Consulta de transporte público para 14 instituições e 29 campi do Distrito Federal, incluindo UnB, UniCEUB, Católica (UCB), UDF, IESB, UNIP, UNIPLAN, Projeção, Estácio, Anhanguera, IFB, UnDF/ESCS, Senac-DF e Unieuro. O site usa dados reais do GeoServer da SEMOB/DF e componentes React reaproveitados do EscalaCCO.

## Abrir e apresentar

- **Versão completa:** https://uniride-kappa.vercel.app — pública, sem login. Use Minha localização ou marque a origem no mapa e escolha o campus de destino.
- **Arquivo local:** dê dois cliques em `../APRESENTAR-UNIRIDE.html` ou neste `index.html`. É uma amostra datada com linhas reais selecionadas de cada campus, trajetos e horários salvos. Sem servidor, não consulta a API nem carrega o mapa-base; as camadas vetoriais continuam disponíveis. Uma faixa informa essa diferença. O arquivo é independente, sem arquivos JS/CSS externos.
- **Aplicação completa no computador:** instale Node.js 20.10+; nesta pasta execute `npm ci` e `npm start`. Abra http://127.0.0.1:4173. A API é consultada pelo servidor local.

O projeto não oferece lotação, vagas, reservas ou previsão inventada de chegada.

## Desenvolvimento

O visual é definido em `src/design.css`, sobre os componentes CCO: navegação no cabeçalho (barra inferior no celular), painel encaixado ao mapa e números de linha em placas. A paleta clara/escura de `src/app.css` foi preservada. Inter compõe a interface e Bricolage Grotesque apenas a marca; ambas estão incluídas em `src/assets/fonts`, com licença OFL, e incorporadas no HTML para funcionar sem carregar fontes de terceiros. Transições respeitam a preferência de movimento reduzido.

```sh
npm run dev                     # build e servidor HTTP local
npm test                        # regras geográficas, calendário, GPS, cache e proxy
npm run build                   # HTML independente + Worker em dist/server/index.js
node scripts/validate-artifact.mjs
node scripts/snapshot.mjs       # atualiza manualmente a amostra pública; depois faça build
```

Edite `src/` e `server/`; `index.html`, `APRESENTAR-UNIRIDE.html` e `dist/` são gerados. Após alterações, rode o build e recarregue a página. `npm run preview` serve o HTML gerado e a API; não há recarga automática. Para outra porta, configure `PORT`.

## Usabilidade e cobertura

- [Aplicação das 10 heurísticas de Nielsen](docs/NIELSEN.md)
- [Instituições, campi, fontes e unidades pendentes](docs/COBERTURA.md)
- [Localização do usuário, paradas próximas e limites de planejamento](docs/ORIGEM.md)

## O que funciona

- Origem por localização do aparelho ou seleção no mapa; paradas em até 800 m do usuário, ordenadas por distância. Seleção de campus, pesquisa por linha/destino e paginação.
- Linhas cujo mesmo traçado passa perto da origem e do campus. Não calcula baldeações nem garante a relação entre cada parada e uma linha.
- Mapa OpenStreetMap/Leaflet com traçados reais, pontos do entorno e posições recentes da linha selecionada.
- Horários de partida programados por data, sentido, máscara semanal e vigência.
- Posições da SEMOB consultadas a cada 30 segundos; pontos com mais de 2 minutos são removidos. A consulta periódica pausa em aba oculta.
- Favoritos por campus com Desfazer, último campus lembrado, busca de instituição/região, ajuda pesquisável e tema claro/escuro com verde fixo. Layout de desktop e celular.
- Estados de carregamento/erro e último resultado válido com data explícita quando a fonte falha dentro do prazo de cache.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `src/App.jsx`, `src/app.css` | Telas e integração visual dos componentes CCO |
| `src/cco/` | Componentes importados/adaptados; origem em README próprio |
| `src/MapView.jsx` | Mapa, camadas, popups e controles |
| `src/config.js`, `src/campuses.json` | Campi, referências verificadas e URLs públicas |
| `src/transport.js` | Geometria, calendário e validação temporal das posições |
| `src/api.js` | Consulta, timeout, atualização e amostra para arquivo local |
| `src/snapshot.json` | Amostra pública, datada, sem posições GPS salvas |
| `server/semob.js`, `server/journey.js` | Adaptador WFS, consulta por origem e endpoints de linhas/posições |
| `src/OriginPicker.jsx`, `src/origin.js` | Permissão de localização, seleção manual e validação |
| `server/cache.js` | Cache em memória por processo/isolate e deduplicação de consultas |
| `worker/index.js` | HTML e API em formato Worker (base da publicação) |
| `api/app.js`, `vercel.json` | Publicação na Vercel: página estática e API como função na região de São Paulo (gru1) |
| `scripts/serve.mjs` | Mesmo adaptador no servidor Node local |
| `docs/DIAGNOSTICO.md` | Revisão do Escala, decisões e limitações |
| `docs/API-SEMOB.md` | Pesquisa da fonte, contratos e referências oficiais |

## API da aplicação

POST `/api/journey`, corpo JSON `{"campus":"unb-darcy","origin":{"lat":-15.7939,"lng":-47.8828}}`. A origem fica no corpo, sem aparecer no histórico de URLs. Consulta sem armazenamento da origem no servidor; resposta `no-store`.

GET `/api/catalog?campus=unb-darcy` (também `ceub-asa-norte` ou `ceub-taguatinga`), GET `/api/line?code=0.110&campus=unb-darcy` e GET `/api/positions?code=0.110&campus=unb-darcy`.

Detalhes e posições exigem campus e recusam linhas fora do seu catálogo. A URL da SEMOB é fixa; o cliente não pode fornecer URL, camada ou CQL arbitrários. Os códigos são validados antes da consulta. Sem credenciais de operadoras. O proxy resolve a ausência de CORS da fonte pública. Catálogo e horários têm cache de 1 hora, com último resultado válido por até 24 horas em caso de falha; posições têm cache de 30 segundos e continuam limitadas pela idade da medição. O cache não é persistente nem compartilhado entre isolates.

## Limites dos dados

Na consulta online, as paradas são próximas da origem do usuário. As linhas precisam ter um mesmo traçado a até 800 m da origem e do campus, medidos aos segmentos do percurso. Isso não comprova ligação entre uma parada e uma linha, ordem da viagem, caminho a pé ou sentido de embarque. Horários são saídas programadas no ponto inicial, não chegada à parada. Não foram validados calendário de feriados, ETA, planejamento com baldeações ou cobertura completa de GPS. `datalocal` sem fuso é interpretado como Brasília, consistente com as amostras; esse fuso não é formalizado no schema.

O serviço público funcionou sem chave e sem cobrança nos testes, mas não foi encontrada garantia de disponibilidade, quota ou licença padronizada. O mapa-base é OpenStreetMap com atribuição visível, sem download em massa ou cache offline. UniRide é um projeto acadêmico independente, sem chancela da SEMOB ou das universidades.

O ZIP original em `../referencia/` e os repositórios EscalaCCO não foram alterados. Favoritos ficam em `localStorage` (`uniride:campus-favorites:v2`) e o tema em `uniride-campus:appearance:v1`; não há contas ou sincronização entre aparelhos.
