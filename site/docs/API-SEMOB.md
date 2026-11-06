# Pesquisa da API pública de ônibus do DF

Verificado em 5 de novembro de 2026, aproximadamente 14h20–14h32, horário de Brasília. Este relatório registra a pesquisa e os testes HTTP; as amostras JSON desta pasta não são uma fonte de posições atuais.

## Conclusão

É possível integrar dados reais hoje, sem chave, por meio do GeoServer oficial da SEMOB. As consultas testadas retornaram HTTP 200 para linhas, itinerários, horários, paradas e posições de veículos. Trata-se de uma API OGC WFS, não de um feed GTFS. O navegador precisa de um proxy no mesmo domínio: o servidor oficial não retornou `Access-Control-Allow-Origin`, inclusive quando recebeu o cabeçalho Origin do UniRide.

Base fixa: https://geoserver.semob.df.gov.br/geoserver/semob/ows

Parâmetros comuns: `service=WFS&version=1.0.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326`. Construir os parâmetros com URLSearchParams. A resposta é GeoJSON com coordenadas `[longitude, latitude]`.

O arquivo `semob-endpoint-checks.json` contém as URLs completas, HTTP, bytes e contagens observadas. Os arquivos `semob-schema-*.json` registram o DescribeFeatureType oficial. As demais amostras têm um subconjunto explicitamente identificado de features públicas.

## Camadas e contratos

| Camada (`typeName`) | Geometria / CRS nativo | Dados úteis |
| --- | --- | --- |
| `semob:percuso das linhas` | `geo_linhas_lin_31983`, EPSG:31983 | `id_linha`, `cd_linha`, `lin_sentido`, `tx_linha`, `fx_tarifaria`, `vl_tarifa`, `lin_extensao`, `situacao` |
| `semob:itinerario_espacial` | `geo_linhas_lin`, EPSG:4326 | `id_linha`, `lin_sentido`, `dataregistro`, `dt_inicio_vigencia`, `dt_fim_vigencia` |
| `semob:Horários das Linhas` | Sem geometria | `id_linha`, `cd_linha`, `nm_operadora`, `sentido`, `hr_prevista`, `tempo_percurso`, `dias_semana`, `dia_label`, datas de vigência |
| `semob:ponto_parada_v2025` | `geom_point`, EPSG:4326 | `cod_parada_v2025`, `endereco`, `dt_carga_dados`, `parada_ativa`, `tipo_abrigo` |
| `semob:ultima_posicao` | `geom_point`, EPSG:4326 | `id_operadora`, `prefixo`, `datalocal`, `cd_linha`, `sentido`, `dataregistro`, `velocidade` |

A grafia oficial é **percuso**, sem o segundo r. Rotas usam sentidos IDA, VOLTA e CIRCULAR. Horários usam I/V/C. A posição transmite códigos 0/1 mesmo para a circular 0.110; não foi confirmada uma associação universal desses códigos aos sentidos de itinerário.

Filtro testado: `CQL_FILTER=cd_linha='0.110'`. A linha Circular Rodoviária do Plano Piloto / UnB retornou 1 itinerário (9.874 bytes), 285 horários (109.019 bytes) e 10 posições (3.430 bytes). Validar previamente o código da linha e nunca aceitar CQL ou URL arbitrária do cliente.

Catálogo observado: 1.407 itinerários/direções, 44.076 registros de horários, 6.687 paradas na camada 2025 e 3.621 registros de última posição. Esses totais são fotografias do teste, não garantias fixas.

## Cuidados para uma interface correta

- Filtrar atualidade por **datalocal**, não por dataregistro: existem posições antigas cuja ingestão é recente. `datalocal` é uma string sem fuso; as amostras são consistentes com Brasília UTC−03, enquanto `dataregistro` vem em ISO UTC. O fuso de datalocal não está formalmente descrito no schema consultado.
- Há coordenadas 0,0, códigos de linha vazios e registros antigos. Validar coordenadas e idade antes de mostrar o marcador. Mostrar o instante da observação e retirar posições vencidas.
- A camada não fornece ETA oficial para cada parada. `hr_prevista` deve ser apresentada como horário programado de partida, nunca como chegada prevista ao usuário. Não foi identificado calendário de exceções/feriados nem associação oficial parada–linha nessas camadas.
- BBOX funciona com `west,south,east,north,EPSG:4326`, mas rotas podem ser selecionadas pela sobreposição do envelope. Refinar pela distância aos segmentos reais; proximidade não comprova uma parada atendida. Usar textos como “linhas no entorno” e “paradas da região”.
- Solicitar explicitamente os campos necessários em posições; o IMEI disponibilizado pela fonte não é necessário e foi excluído das amostras.
- Não há vagas, reservas de assento ou ocupação nos contratos testados.
- Sugestão operacional: cache de catálogo/horários, atualização de posições a cada 30–60 segundos com pausa em aba oculta, timeout e indicação clara de indisponibilidade. Essa cadência é uma recomendação do projeto, não uma quota documentada pela SEMOB.

## Referências dos campi

- UnB: [LCCMat/Instituto de Física, ICC Norte](https://lccmat.unb.br/contact/) publica 15°45′47″S 47°52′12″W, aproximadamente latitude −15.7630556, longitude −47.8700. É uma referência no campus, não todas as suas entradas.
- CEUB Asa Norte: [página oficial](https://www.uniceub.br/asa-norte) confirma SEPN 707/907, mas não foi encontrada coordenada explícita. O centro provisório −15.7665, −47.8935 deve permanecer identificado como aproximado. O [Intercom 2026 do CEUB](https://institucional.uniceub.br/intercom-2026) cita algumas linhas da região; não deve ser usado como catálogo completo nem para substituir a fonte atual.
- CEUB Taguatinga: [página oficial](https://www.uniceub.br/taguatinga) confirma QS 1, Lote 1/17, Rua 214 e vincula Street View em −15.835069, −48.0456902. Trata-se da posição de uma câmera próxima, não de uma coordenada formal da portaria. O valor provisório anterior −15.8379, −48.0346 ficava cerca de 1,2 km a leste; as fixtures desta pasta foram corrigidas.

## Acesso, licença e limites

O [GeoServer oficial](https://geoserver.semob.df.gov.br/geoserver/web/) anuncia acesso anônimo. Seu [GetCapabilities](https://geoserver.semob.df.gov.br/geoserver/semob/ows?service=WFS&version=1.0.0&request=GetCapabilities) declara `Fees=NONE` e `AccessConstraints=NONE`. O [PDTI da SEMOB](https://semob.df.gov.br/wp-conteudo/uploads/2024/12/capa-PDTI-completa-1.pdf) descreve o GeoServer como disponibilização de informações do STPC para a comunidade, incluindo linhas, paradas e posições.

Não foi encontrada uma licença padronizada como CC BY, quota formal ou SLA específico para essas camadas. Acesso anônimo e ausência de taxas não equivalem, isoladamente, a uma licença detalhada de redistribuição. Atribuir “Fonte: SEMOB/GDF” e registrar o horário de consulta; não alegar parceria ou chancela oficial.

A [Portaria SEMOB 18/2019, art. 9](https://www.sinj.df.gov.br/sinj/Norma/d8f05feb784841c792a6df8a0fdfb98b/semob_prt_18_2019.html) esclarece que a ausência de homologação não impede o funcionamento de aplicativos, mas não dá direito a chancela/publicidade do governo. Serviços adicionais privados ou acordos com operadores são outra etapa; não foram usados credenciais ou endpoints autenticados.

## Alternativas e lacunas

Não foi localizado e validado nesta pesquisa um GTFS/GTFS-Realtime público atual de ônibus do DF. Isso é uma lacuna da descoberta, não prova de inexistência. A [Mobility Database](https://mobilitydatabase.org/faq) é um catálogo gratuito; sua API exige conta, e encontrar feeds de outras cidades ou bicicletas de Brasília não resolve ônibus do DF.

O antigo endpoint CKAN `https://dados.df.gov.br/api/3/action/package_search?q=transporte` retornou HTTP 404 no teste. Não é uma alternativa operacional ao GeoServer hoje. As integrações locais Mobilibus/Mobility observadas no código usam autenticação e não foram utilizadas como API pública.

Para planejamento completo de viagens com baldeações e previsão de chegada por parada, ainda faltam dados/contratos adicionais. Para consulta de linhas, mapa de itinerários, horários programados e localização recente dos ônibus, a fonte SEMOB testada já atende à primeira versão funcional.
