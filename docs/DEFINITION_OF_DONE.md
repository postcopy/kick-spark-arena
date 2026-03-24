# Definition of Done (DoD)

Criterios que devem ser atendidos antes de qualquer feature ou correcao ser considerada pronta.

---

## Codigo

- [ ] Codigo compila sem erros (`npm run build` e `npm run build:championship`)
- [ ] Lint passa sem warnings bloqueantes (`npm run lint`)
- [ ] Testes unitarios passam (`npm test`)
- [ ] Novos testes foram escritos para logica critica adicionada/alterada
- [ ] Nenhum `console.log` de debug foi deixado no codigo de producao
- [ ] TypeScript strict: sem uso de `any` desnecessario

## Funcionalidade

- [ ] Feature funciona no modo web (browser)
- [ ] Feature funciona no Electron (desktop)
- [ ] Testado com hardware real (sensor USB) quando envolve serial/impacto
- [ ] Testado cenario de desconexao USB (app nao trava, mostra feedback)
- [ ] Sem memory leaks: timers e listeners sao limpos no cleanup

## Campeonato (SPE Sulsport)

- [ ] Scoreboard atualiza corretamente em tempo real
- [ ] Painel do operador envia comandos corretamente
- [ ] Tela TV reflete mudancas do operador
- [ ] Registro de atletas e chaveamento funcionam

## S-FIGHT PRO (Modos de Jogo)

- [ ] Modo Arcade: pontuacao e combo funcionam
- [ ] Modo Time Attack: timer e auto-pause funcionam
- [ ] Modo Reacao: alvos aparecem e sao detectados corretamente
- [ ] Deteccao de impacto: `noiseIntensityMin` configurado corretamente

## UX

- [ ] App responsivo em telas de 1024px+ (desktop/TV)
- [ ] Navegacao entre paginas nao deixa estados residuais
- [ ] Feedback visual para acoes do usuario (loading, sucesso, erro)
- [ ] Textos em portugues (PT-BR) para interface do usuario

## Review e Merge

- [ ] Pull Request criado com descricao clara do que foi feito
- [ ] CI pipeline passa (lint, test, build)
- [ ] Code review feito por pelo menos 1 pessoa (quando aplicavel)
- [ ] Branch mergeada em `main` sem conflitos
- [ ] CHANGELOG.md atualizado com as mudancas
