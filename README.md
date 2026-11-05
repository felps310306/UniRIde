# UniRide

Projeto acadêmico de consulta de transporte público para chegar às instituições de ensino superior do Distrito Federal.

## Aplicação hospedada

### [Abrir o UniRide](https://uniride-campus-brasilia-lf.lipibcg.chatgpt.site/)

**Acesso público:** desde 05/11/2026, qualquer pessoa com o link pode abrir o UniRide sem login. O site e a API foram verificados por requisições anônimas.

A hospedagem do ChatGPT Sites está atualmente incluída nos planos Plus e Pro. Não há garantia contratual registrada neste projeto de disponibilidade até dezembro de 2026; a continuidade depende das condições da plataforma e da fonte SEMOB. [Condições atuais do Sites](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites).

A demonstração hospedada consulta dados públicos da SEMOB/DF: linhas próximas aos campi, paradas da região, traçados, horários programados e posições recentes dos ônibus. Horários de saída não são previsões de chegada à parada. Não há reserva de lugar nem informação de vagas.

## Estrutura deste repositório

- `frontend/`: aplicação React/Vite.
- `backend/`: aplicação Spring Boot.

O link acima é a demonstração hospedada do projeto. O acesso e a disponibilidade dos dados dependem, respectivamente, da hospedagem e da fonte SEMOB.

## Usabilidade e cobertura da demonstração

- [Aplicação das 10 heurísticas de Nielsen](NIELSEN.md)
- [14 instituições, 29 campi e unidades adicionais pendentes](COBERTURA.md)
- [Fontes da pesquisa dos campi](CAMPI-PESQUISA.md)

A lista de instituições inclui UnB, UniCEUB, Católica (UCB), UDF, IESB, UNIP, UNIPLAN, Projeção, Estácio, Anhanguera, IFB, UnDF/ESCS, Senac-DF e Unieuro. A consulta parte da localização do usuário: mostra paradas próximas à origem e linhas cujo mesmo traçado também passa perto do campus escolhido. Não calcula baldeações nem garante a associação entre uma parada e uma linha.

[Localização do usuário e limites de planejamento](ORIGEM.md).
