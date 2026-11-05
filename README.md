# UniRide

Projeto acadêmico de consulta de transporte público para chegar às instituições de ensino superior do Distrito Federal.

## Aplicação hospedada

### [Abrir o UniRide](https://uniride-campus-brasilia-lf.lipibcg.chatgpt.site/)

**Acesso privado:** a hospedagem exige login do proprietário no ChatGPT. Publicar este link no GitHub não concede acesso a outras contas. Essa restrição foi mantida por escolha do responsável pelo projeto.

A demonstração hospedada consulta dados públicos da SEMOB/DF: linhas próximas aos campi, paradas da região, traçados, horários programados e posições recentes dos ônibus. Horários de saída não são previsões de chegada à parada. Não há reserva de lugar nem informação de vagas.

## Estrutura deste repositório

- `frontend/`: aplicação React/Vite.
- `backend/`: aplicação Spring Boot.

O link acima é a demonstração hospedada do projeto. O acesso e a disponibilidade dos dados dependem, respectivamente, da hospedagem e da fonte SEMOB.

## Usabilidade e cobertura da demonstração

- [Aplicação das 10 heurísticas de Nielsen](NIELSEN.md)
- [14 instituições, 29 campi e unidades adicionais pendentes](COBERTURA.md)
- [Fontes da pesquisa dos campi](CAMPI-PESQUISA.md)

A lista de instituições inclui UnB, UniCEUB, Católica (UCB), UDF, IESB, UNIP, UNIPLAN, Projeção, Estácio, Anhanguera, IFB, UnDF/ESCS, Senac-DF e Unieuro. Cada consulta é limitada às linhas no entorno do campus escolhido.
