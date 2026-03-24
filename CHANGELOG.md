# Changelog

Todas as mudancas relevantes do projeto S-FIGHT PRO e SPE Sulsport serao documentadas neste arquivo.

## [1.1.0] - 2026-03-20

### Corrigido
- Pontuacao em campeonato: contador IMP ficava em 0 (noiseIntensityMin reduzido de 15 para 1)
- Reconexao USB: dispositivo parava de funcionar apos desconectar/reconectar
- Jogo pausa automaticamente quando USB desconecta durante Time Attack
- Modo PassThrough agora reseta corretamente ao navegar entre paginas
- Polling de diagnosticos do detector nao causa mais re-renders excessivos
- Limpeza de timers ao navegar pela sidebar (previne memory leaks)

### Adicionado
- Overlay de debug aprimorado: contadores REJ, ACT, FEED, NIM, dS + toggle PT
- Modo Pass-Through para bypass de todos os filtros do detector (debug)
- Diagnosticos do ImpactDetector (contagem de rejeicoes, ultimos valores alimentados, snapshot de config)
- HardwarePanel e HardwareTestOverlay para diagnostico de hardware em campeonatos
- Tela LiveScore para acompanhamento ao vivo de pontuacoes
- Pipeline CI/CD com GitHub Actions
- Testes unitarios para csvParser, deviceMapping, impactDetector e bracketGenerator
- ErrorBoundary component para captura de erros em runtime
- ImmersiveTitleBar para barra de titulo customizada no Electron
- Sincronizacao em tempo real via useRealtimeSync hook

### Alterado
- noiseIntensityMin padrao reduzido de 15 para 1 em todos os modos
- Modos de jogo do S-FIGHT PRO agora usam noiseIntensityMin: 1
- Versao atualizada para 1.1.0

## [1.0.0] - 2026-03-15

### Lancamento inicial
- S-FIGHT PRO: app de treino de Taekwondo com modos Arcade, Time Attack e Reacao
- SPE Sulsport: sistema de campeonato com scoreboard, painel do operador e TV
- Conexao serial USB com sensores de impacto (CP2102/CP2104)
- Deteccao de impacto com filtros configuráveis (ImpactDetector)
- Mapeamento de dispositivos por porta serial
- Sistema de registro de atletas com importacao CSV
- Gerador de chaves de campeonato
- Dashboard com historico de sessoes de treino
- Ranking de atletas
- Suporte a Electron para distribuicao desktop (Windows)
- Integracao com Supabase para persistencia e autenticacao
