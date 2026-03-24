# Checklist de Release

Passo a passo para lancar uma nova versao do S-FIGHT PRO e SPE Sulsport.

---

## 1. Pre-release: Testes

- [ ] Rodar lint: `npm run lint`
- [ ] Rodar testes unitarios: `npm test` (ou `npx vitest run`)
- [ ] Build web do S-FIGHT PRO: `npm run build`
- [ ] Build web do SPE Sulsport: `npm run build:championship`
- [ ] Testar conexao serial USB com sensor real (CP2102/CP2104)
- [ ] Testar deteccao de impacto em cada modo (Arcade, Time Attack, Reacao)
- [ ] Testar fluxo de campeonato: registro de atletas, chaveamento, scoreboard
- [ ] Testar reconexao USB (desconectar e reconectar durante uso)
- [ ] Testar em tela cheia no Electron (ambos apps)
- [ ] Verificar que overlay de debug funciona (REJ, ACT, FEED, NIM, dS)

## 2. Bump de Versao

- [ ] Atualizar `version` no `package.json`
- [ ] Atualizar `CHANGELOG.md` com as mudancas da nova versao
- [ ] Commit: `git commit -m "chore: bump version to X.Y.Z"`

## 3. Build dos Instaladores

```bash
# Compilar TypeScript do Electron
npm run electron:compile

# Build + empacotamento S-FIGHT PRO
npm run build
npx electron-builder --win --config electron-builder.yml

# Build + empacotamento SPE Sulsport
npm run build:championship
npx electron-builder --win --config electron-builder-championship.yml
```

Instaladores gerados:
- `release/S-FIGHT-PRO-Setup-X.Y.Z.exe`
- `release-championship/SPE-Sulsport-Setup-X.Y.Z.exe`

## 4. Teste do Instalador

- [ ] Instalar o .exe em uma maquina limpa (ou VM)
- [ ] Verificar que o app abre sem erros
- [ ] Testar conexao serial no app instalado
- [ ] Verificar que os drivers CP210x sao incluidos no pacote (`extraResources`)
- [ ] Testar atualizacao automatica (electron-updater) se configurado

## 5. Tag e Release no GitHub

```bash
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

- [ ] Criar Release no GitHub com os instaladores .exe anexados
- [ ] Copiar notas do CHANGELOG.md para a descricao da release

## 6. Distribuicao

- [ ] Enviar instaladores para os clientes/academias
- [ ] Atualizar link de download no site (se aplicavel)
- [ ] Comunicar mudancas aos usuarios (WhatsApp, email, etc.)

## 7. Pos-release

- [ ] Monitorar feedback dos usuarios nos primeiros dias
- [ ] Verificar logs do Supabase para erros novos
- [ ] Criar branch `develop` para proxima iteracao se necessario
