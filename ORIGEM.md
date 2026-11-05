# Consulta a partir da localização do usuário

Implementado em 05/11/2026. O fluxo online começa na origem do passageiro e termina no campus escolhido.

1. Usar minha localização pede permissão ao navegador, em HTTPS, apenas após o clique. A posição não é presumida nem substituída por um ponto de exemplo.
2. Marcar no mapa permite escolher a origem sem GPS. Latitude e longitude oferecem uma alternativa por teclado. A confirmação fica desabilitada sem um ponto válido.
3. Após escolher a origem, Perto de mim mostra paradas da SEMOB em até 800 m, ordenadas por distância em linha reta.
4. Linhas compara cada variante do traçado com a origem e o campus. Só entram as que passam perto dos dois pontos. Trocar o campus preserva a origem e refaz a consulta.
5. É possível atualizar, alterar ou remover a origem. Ao recarregar, ela é apagada; apenas o último campus e os favoritos permanecem.

## Contrato

POST `/api/journey`, com `Content-Type: application/json`:

```json
{"campus":"unb-darcy","origin":{"lat":-15.7939,"lng":-47.8828}}
```

O exemplo usa uma referência pública da Rodoviária do Plano Piloto, não a localização de uma pessoa. Coordenadas precisam ser números dentro da cobertura do DF; corpo limitado a 1 KB. GET retorna 405. A resposta traz `mode: "origin"`, `lines`, `stops`, `radius` e a data da consulta.

A posição é transmitida ao próprio servidor para calcular as áreas consultadas no GeoServer da SEMOB. Não entra em parâmetros da URL, favoritos, localStorage ou cache do servidor. A aplicação não grava histórico de localização. A resposta é `Cache-Control: no-store`; logs e políticas da infraestrutura continuam sob responsabilidade dos provedores. O mapa-base usa OpenStreetMap.

## Limites

- A proximidade entre traçado, origem e destino indica uma opção a conferir, não um itinerário completo validado.
- Não há relação oficial linha–parada importada, cálculo da ordem de embarque/desembarque, caminhada roteada ou baldeações. A ordem das coordenadas não é usada como garantia do sentido de viagem.
- Não encontrar uma mesma variante perto dos dois pontos não significa ausência de transporte. Paradas próximas continuam disponíveis, com link ao DF no Ponto para planejamento complementar.
- GPS depende do aparelho, HTTPS e permissão. Falhas de permissão, indisponibilidade, timeout e posição fora do DF têm recuperação por seleção manual. Precisão acima de 200 m gera orientação para ajustar o ponto.
- Arquivo HTML local mantém a amostra por campus, explicitamente identificada; não simula paradas próximas à localização do usuário.

## Verificação

17 testes automatizados aprovados: incluindo exclusão de paradas próximas apenas ao campus, ordenação por origem, variantes incompatíveis, ausência de conexão direta, validação de coordenadas, formato/tamanho/método de requisição e mensagens de localização.

Consultas reais: Rodoviária do Plano Piloto → UnB retornou 18 paradas da origem e a circular 0.110; origem de referência em Taguatinga retornou outra lista. UI local verificada com origem manual, troca de destino, detalhe da linha e layout de celular. Não se simulou nem capturou a posição real do usuário durante a verificação.

Referências: [Geolocation API / MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition), [pesquisa geral oficial do DF no Ponto](https://dfnoponto.semob.df.gov.br/pesquisa-geral/).
