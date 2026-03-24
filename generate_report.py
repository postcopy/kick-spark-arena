#!/usr/bin/env python3
"""Generate modern professional PDF report for Sulsport."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas
from datetime import datetime
import os

W, H = A4
# Brand colors
C_RED = HexColor('#E11D48')
C_DARK = HexColor('#0F0F1A')
C_CARD = HexColor('#16162A')
C_BORDER = HexColor('#2A2A45')
C_TEXT = HexColor('#CBD5E1')
C_MUTED = HexColor('#64748B')
C_WHITE = white
C_SURFACE = HexColor('#1E1E35')
C_GREEN = HexColor('#22C55E')
C_BLUE = HexColor('#3B82F6')
C_YELLOW = HexColor('#EAB308')
C_PURPLE = HexColor('#A855F7')


def bg_page(c, doc):
    """Dark background + accent stripe on every page."""
    c.saveState()
    # Full dark bg
    c.setFillColor(C_DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # Top red accent bar
    c.setFillColor(C_RED)
    c.rect(0, H - 4*mm, W, 4*mm, fill=1, stroke=0)
    # Footer
    c.setFont('Helvetica', 7)
    c.setFillColor(C_MUTED)
    c.drawString(20*mm, 10*mm, 'Sulsport Score  |  Relatorio Tecnico  |  Confidencial')
    c.drawRightString(W - 20*mm, 10*mm, f'{doc.page}')
    c.restoreState()


def S(name, **kw):
    """Quick style factory."""
    defaults = dict(fontName='Helvetica', fontSize=10, textColor=C_TEXT, leading=14)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)


# Pre-built styles
ST = {
    'h1': S('h1', fontName='Helvetica-Bold', fontSize=26, textColor=C_WHITE, leading=30),
    'h2': S('h2', fontName='Helvetica-Bold', fontSize=15, textColor=C_WHITE, leading=20, spaceBefore=2*mm),
    'h3': S('h3', fontName='Helvetica-Bold', fontSize=11, textColor=C_RED, leading=15, spaceBefore=1*mm),
    'body': S('body', fontSize=9, textColor=C_TEXT, leading=13),
    'small': S('small', fontSize=8, textColor=C_MUTED, leading=11),
    'tag': S('tag', fontName='Helvetica-Bold', fontSize=7, textColor=C_WHITE, leading=10, alignment=TA_CENTER),
    'metric_num': S('mn', fontName='Helvetica-Bold', fontSize=22, textColor=C_WHITE, leading=26, alignment=TA_CENTER),
    'metric_lbl': S('ml', fontSize=7, textColor=C_MUTED, leading=10, alignment=TA_CENTER),
    'th': S('th', fontName='Helvetica-Bold', fontSize=8, textColor=C_MUTED, leading=11),
    'td': S('td', fontSize=8, textColor=C_TEXT, leading=11),
    'td_b': S('tdb', fontName='Helvetica-Bold', fontSize=8, textColor=C_WHITE, leading=11),
    'big_price': S('bp', fontName='Helvetica-Bold', fontSize=28, textColor=C_RED, leading=34, alignment=TA_CENTER),
    'price_note': S('pn', fontSize=8, textColor=C_MUTED, leading=11, alignment=TA_CENTER),
}


def card_table(data, col_widths, header=True):
    """Dark themed table with optional header."""
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, -1), C_CARD),
        ('TEXTCOLOR', (0, 0), (-1, -1), C_TEXT),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, C_BORDER),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
    ]
    if header:
        style_cmds += [
            ('BACKGROUND', (0, 0), (-1, 0), C_SURFACE),
            ('TEXTCOLOR', (0, 0), (-1, 0), C_MUTED),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, C_BORDER),
        ]
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    t.setStyle(TableStyle(style_cmds))
    return t


def metric_card(val, label):
    data = [
        [Paragraph(str(val), ST['metric_num'])],
        [Paragraph(label, ST['metric_lbl'])],
    ]
    t = Table(data, colWidths=[38*mm], rowHeights=[9*mm, 5*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_CARD),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (0, 0), 3*mm),
        ('BOTTOMPADDING', (0, -1), (0, -1), 2*mm),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('BOX', (0, 0), (-1, -1), 0.3, C_BORDER),
    ]))
    return t


def severity_tag(text, color=C_RED):
    data = [[Paragraph(text, ST['tag'])]]
    t = Table(data, colWidths=[16*mm], rowHeights=[5*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [2, 2, 2, 2]),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


def section(title):
    """Section header with red left bar."""
    data = [[Paragraph(title, ST['h2'])]]
    t = Table(data, colWidths=[W - 40*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_SURFACE),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('LINEBELOW', (0, 0), (-1, -1), 2, C_RED),
    ]))
    return t


def build():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Relatorio_Sulsport_v2.pdf')
    doc = SimpleDocTemplate(out, pagesize=A4, topMargin=12*mm, bottomMargin=18*mm, leftMargin=20*mm, rightMargin=20*mm)
    story = []
    cw = W - 40*mm  # content width

    # ═══════════════════════ PAGE 1 — COVER ═══════════════════════
    story.append(Spacer(1, 18*mm))
    story.append(Paragraph('RELATORIO TECNICO', ST['h1']))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph('S-FIGHT PRO + SPE Sulsport Championship  |  v1.1.0', S('sub', fontSize=11, textColor=C_MUTED, leading=14)))
    story.append(Spacer(1, 1*mm))
    story.append(Paragraph(f'{datetime.now().strftime("%d/%m/%Y")}  |  Plataforma: Windows (Electron)  |  Hardware: EngFlex USB', ST['small']))
    story.append(Spacer(1, 8*mm))

    # Metrics row 1
    m1 = [metric_card(v, l) for v, l in [('15+', 'Arquivos criados'), ('35+', 'Arquivos editados'), ('104', 'Testes escritos'), ('9', 'Bugs corrigidos')]]
    t1 = Table([m1], colWidths=[cw/4]*4)
    t1.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t1)
    story.append(Spacer(1, 2*mm))

    # Metrics row 2
    m2 = [metric_card(v, l) for v, l in [('12', 'Features novas'), ('22', 'Sons gerados'), ('20+', 'Builds entregues'), ('85h', 'Horas estimadas')]]
    t2 = Table([m2], colWidths=[cw/4]*4)
    t2.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t2)
    story.append(Spacer(1, 8*mm))

    # Scope
    story.append(section('ESCOPO'))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        'Correcao de bugs criticos de scoring e conectividade USB, implementacao de features de gameplay '
        '(Frenzy Zone, inversao do Duelo, categorias por idade), sistema de audio profissional com '
        'ElevenLabs, infraestrutura DevOps (CI/CD, Docker), 104 testes automatizados, melhorias de '
        'UX/acessibilidade, e otimizacoes de backend. Dois instaladores Windows entregues: S-FIGHT PRO '
        '(modos arcade/festival) e SPE Sulsport Championship (campeonato profissional).', ST['body']))
    story.append(Spacer(1, 6*mm))

    # ═══════════════════════ BUGS ═══════════════════════
    story.append(section('1. BUGS CRITICOS CORRIGIDOS'))
    story.append(Spacer(1, 2*mm))

    sev_colors = {'Critica': C_RED, 'Alta': HexColor('#F97316'), 'Media': C_YELLOW, 'Baixa': C_BLUE}
    bugs = [
        ['SPE nao marcava pontos', 'Alta', 'ImpactDetector timing na conexao serial', '3h'],
        ['Tela preta apos build', 'Critica', 'Import useMemo removido acidentalmente', '1h'],
        ['USB reconexao falhava', 'Alta', 'Backoff exponencial 1s/3s/5s', '2h'],
        ['Modos voltavam ao menu', 'Alta', 'Cleanup useEffect disparava reset', '2h'],
        ['Championship crashando', 'Critica', 'ErrorBoundary + SoundProvider stub', '3h'],
        ['ESC saia do fullscreen', 'Media', 'Handler ESC removido do Electron', '0.5h'],
        ['IntroScreen reabria', 'Media', 'SessionStorage para persistir estado', '0.5h'],
        ['Unicode encoding', 'Baixa', 'Caracteres UTF-8 nos textos', '0.5h'],
        ['SoundProvider crashava', 'Alta', 'Try/catch + stub em cada Audio()', '2h'],
    ]

    bug_data = [[Paragraph('BUG', ST['th']), Paragraph('SEV.', ST['th']),
                  Paragraph('SOLUCAO', ST['th']), Paragraph('H', ST['th'])]]
    for b in bugs:
        bug_data.append([
            Paragraph(b[0], ST['td_b']),
            severity_tag(b[1], sev_colors.get(b[1], C_MUTED)),
            Paragraph(b[2], ST['td']),
            Paragraph(b[3], ST['td']),
        ])
    story.append(card_table(bug_data, [38*mm, 20*mm, 85*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~16 horas', ST['small']))

    story.append(PageBreak())

    # ═══════════════════════ PAGE 2 — FEATURES ═══════════════════════
    story.append(Spacer(1, 8*mm))
    story.append(section('2. FEATURES IMPLEMENTADAS'))
    story.append(Spacer(1, 2*mm))

    feats = [
        ['Frenzy Zone', 'Multiplicador x2 nos ultimos 10s do Contra o Tempo', '4h'],
        ['Inversao do Duelo', 'Dano vai pro oponente, nao em si mesmo', '3h'],
        ['HP Bars invertidas', 'Cada atleta ve HP do oponente no seu lado', '2h'],
        ['Categorias por Idade', '5 presets com debounce (Kids A/B, Juvenil, Adulto, Avancado)', '4h'],
        ['IntroScreen EA Sports', 'Splash com logo, particulas, fullscreen, audio unlock', '3h'],
        ['Fullscreen imersivo', 'Sem barra, cursor oculto, menu oculto no gameplay', '2h'],
        ['Sidebar auto-hide', 'Menu esconde nos 3 modos durante gameplay ativo', '1h'],
        ['Music Player', 'Sistema completo de playlist (criado e removido a pedido)', '3h'],
        ['Debug overlay', 'PKT/IMP/SCR/IGN/RAW contadores para diagnostico hardware', '2h'],
    ]

    feat_data = [[Paragraph('FEATURE', ST['th']), Paragraph('DESCRICAO', ST['th']), Paragraph('H', ST['th'])]]
    for f in feats:
        feat_data.append([Paragraph(f[0], ST['td_b']), Paragraph(f[1], ST['td']), Paragraph(f[2], ST['td'])])
    story.append(card_table(feat_data, [38*mm, 107*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~24 horas', ST['small']))
    story.append(Spacer(1, 5*mm))

    # ═══════════════════════ AUDIO ═══════════════════════
    story.append(section('3. AUDIO PROFISSIONAL'))
    story.append(Spacer(1, 2*mm))

    audio = [
        ['ElevenLabs API', '22 efeitos sonoros unicos gerados', '3h'],
        ['Identidade sonora', '3 estilos testados, escolha hibrida A+C', '2h'],
        ['Pool round-robin', '3 instancias por som, sem repeticao', '2h'],
        ['Crash protection', 'Try/catch em cada Audio, stub silencioso', '1.5h'],
        ['Prompts Suno AI', '12 prompts para musica de fundo', '1.5h'],
    ]

    aud_data = [[Paragraph('ITEM', ST['th']), Paragraph('DETALHE', ST['th']), Paragraph('H', ST['th'])]]
    for a in audio:
        aud_data.append([Paragraph(a[0], ST['td_b']), Paragraph(a[1], ST['td']), Paragraph(a[2], ST['td'])])
    story.append(card_table(aud_data, [38*mm, 107*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~10 horas', ST['small']))
    story.append(Spacer(1, 5*mm))

    # ═══════════════════════ DEVOPS ═══════════════════════
    story.append(section('4. DEVOPS / INFRAESTRUTURA'))
    story.append(Spacer(1, 2*mm))

    devops = [
        ['CI/CD GitHub Actions', '3 jobs: lint+test, build-web, build-electron', '2h'],
        ['Docker + Nginx', 'Multi-stage build, SPA routing, security headers', '2h'],
        ['Cross-platform', 'macOS (dmg) + Linux (AppImage/deb)', '1h'],
        ['Documentacao', 'CHANGELOG, RELEASE_CHECKLIST, DEFINITION_OF_DONE', '2h'],
        ['Versioning', 'v1.0.0 para v1.1.0 com changelog', '1h'],
    ]

    dev_data = [[Paragraph('ITEM', ST['th']), Paragraph('DETALHE', ST['th']), Paragraph('H', ST['th'])]]
    for d in devops:
        dev_data.append([Paragraph(d[0], ST['td_b']), Paragraph(d[1], ST['td']), Paragraph(d[2], ST['td'])])
    story.append(card_table(dev_data, [38*mm, 107*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~8 horas', ST['small']))

    story.append(PageBreak())

    # ═══════════════════════ PAGE 3 — TESTS, UX, BACKEND ═══════════════════════
    story.append(Spacer(1, 8*mm))
    story.append(section('5. TESTES AUTOMATIZADOS'))
    story.append(Spacer(1, 2*mm))

    tests = [
        ['useSerialPort.test.ts', '33 testes — parseLine, regex, equipment mapping', '3h'],
        ['useGameState.test.ts', '34 testes — state machine, scoring, Frenzy', '2.5h'],
        ['useArcadeState.test.ts', '37 testes — HP, dano, KO, rounds, match', '2.5h'],
    ]
    test_data = [[Paragraph('ARQUIVO', ST['th']), Paragraph('COBERTURA', ST['th']), Paragraph('H', ST['th'])]]
    for t in tests:
        test_data.append([Paragraph(t[0], ST['td_b']), Paragraph(t[1], ST['td']), Paragraph(t[2], ST['td'])])
    story.append(card_table(test_data, [42*mm, 103*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~8 horas  |  104 testes passando', ST['small']))
    story.append(Spacer(1, 5*mm))

    # UX
    story.append(section('6. UX / ACESSIBILIDADE'))
    story.append(Spacer(1, 2*mm))
    ux = [
        ['Terminologia', '"Aluno" > "Atleta", "Corrida" > "Arena", "Piloto" > "Atleta"', '2h'],
        ['Acessibilidade WCAG', 'Focus indicators, contraste AA, ARIA roles', '2h'],
        ['Dashboard', 'Error handling, empty states, toasts', '1.5h'],
        ['Resultado', 'Msgs para 0 chutes, novo recorde, empate', '1h'],
        ['Hardware indicators', '"Requer sensor" vs "Tela touch" por modo', '0.5h'],
        ['Paywall', 'Texto "teste gratuito", dados preservados', '1h'],
    ]
    ux_data = [[Paragraph('ITEM', ST['th']), Paragraph('DETALHE', ST['th']), Paragraph('H', ST['th'])]]
    for u in ux:
        ux_data.append([Paragraph(u[0], ST['td_b']), Paragraph(u[1], ST['td']), Paragraph(u[2], ST['td'])])
    story.append(card_table(ux_data, [38*mm, 107*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~8 horas', ST['small']))
    story.append(Spacer(1, 5*mm))

    # Backend
    story.append(section('7. BACKEND / BANCO DE DADOS'))
    story.append(Spacer(1, 2*mm))
    be = [
        ['Migration SQL', 'Foreign keys com CASCADE em championship_matches', '1h'],
        ['Query optimization', 'StudentProfile: N+1 eliminado com filtro no banco', '1.5h'],
        ['Dashboard query', 'Limite 1 ano em solo_results (era sem filtro)', '0.5h'],
        ['Registration rollback', 'Delete header se athletes insert falha', '1h'],
    ]
    be_data = [[Paragraph('ITEM', ST['th']), Paragraph('DETALHE', ST['th']), Paragraph('H', ST['th'])]]
    for b in be:
        be_data.append([Paragraph(b[0], ST['td_b']), Paragraph(b[1], ST['td']), Paragraph(b[2], ST['td'])])
    story.append(card_table(be_data, [38*mm, 107*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~5 horas', ST['small']))
    story.append(Spacer(1, 5*mm))

    # Architecture
    story.append(section('8. ARQUITETURA / PROTECAO'))
    story.append(Spacer(1, 2*mm))
    arch = [
        ['ErrorBoundary granular', '3 boundaries: Audio, Hardware, App', '1.5h'],
        ['SoundProvider crash-proof', 'Stub silencioso se audio init falha', '1h'],
        ['Serial backoff', '1s > 3s > 5s com max 3 tentativas', '1.5h'],
        ['ImpactDetector always-on', 'Elimina race condition serial vs mount', '1.5h'],
        ['DevTools condicional', 'F12 so com ELECTRON_DEBUG=1', '0.5h'],
    ]
    ar_data = [[Paragraph('ITEM', ST['th']), Paragraph('DETALHE', ST['th']), Paragraph('H', ST['th'])]]
    for a in arch:
        ar_data.append([Paragraph(a[0], ST['td_b']), Paragraph(a[1], ST['td']), Paragraph(a[2], ST['td'])])
    story.append(card_table(ar_data, [42*mm, 103*mm, 12*mm]))
    story.append(Paragraph('Subtotal: ~6 horas', ST['small']))

    story.append(PageBreak())

    # ═══════════════════════ PAGE 4 — TOTALS ═══════════════════════
    story.append(Spacer(1, 10*mm))
    story.append(section('RESUMO DE HORAS'))
    story.append(Spacer(1, 3*mm))

    summary = [
        ['Bugs criticos corrigidos', '16h'],
        ['Features implementadas', '24h'],
        ['Audio profissional', '10h'],
        ['DevOps / Infraestrutura', '8h'],
        ['Testes automatizados', '8h'],
        ['UX / Acessibilidade', '8h'],
        ['Backend / Banco de dados', '5h'],
        ['Arquitetura / Protecao', '6h'],
    ]

    sum_data = []
    for s in summary:
        sum_data.append([Paragraph(s[0], ST['td_b']), Paragraph(s[1], ST['td'])])
    # Total row
    sum_data.append([
        Paragraph('TOTAL', S('tt', fontName='Helvetica-Bold', fontSize=11, textColor=C_WHITE)),
        Paragraph('85 HORAS', S('tv', fontName='Helvetica-Bold', fontSize=11, textColor=C_RED)),
    ])

    sum_table = Table(sum_data, colWidths=[cw - 30*mm, 30*mm])
    sum_style = [
        ('BACKGROUND', (0, 0), (-1, -2), C_CARD),
        ('BACKGROUND', (0, -1), (-1, -1), C_SURFACE),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 5*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5*mm),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, C_BORDER),
        ('LINEABOVE', (0, -1), (-1, -1), 1, C_RED),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [3, 3, 3, 3]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
    ]
    st = Table(sum_data, colWidths=[cw - 30*mm, 30*mm])
    st.setStyle(TableStyle(sum_style))
    story.append(st)
    story.append(Spacer(1, 10*mm))

    # Price card
    story.append(section('INVESTIMENTO'))
    story.append(Spacer(1, 3*mm))

    ref = [
        ['Dev Senior Freelancer', 'R$ 150-200/h', 'R$ 12.750 - R$ 17.000'],
        ['Dev Senior PJ Especializado', 'R$ 200-300/h', 'R$ 17.000 - R$ 25.500'],
        ['Consultoria Tecnica', 'R$ 250-400/h', 'R$ 21.250 - R$ 34.000'],
    ]
    ref_data = [[Paragraph('PERFIL', ST['th']), Paragraph('VALOR/HORA', ST['th']), Paragraph('TOTAL (85h)', ST['th'])]]
    for r in ref:
        ref_data.append([Paragraph(r[0], ST['td_b']), Paragraph(r[1], ST['td']), Paragraph(r[2], ST['td'])])
    story.append(card_table(ref_data, [55*mm, 40*mm, 60*mm]))
    story.append(Spacer(1, 8*mm))

    # Big price highlight
    price_box = [[Paragraph('FAIXA SUGERIDA', S('fs', fontName='Helvetica-Bold', fontSize=9, textColor=C_MUTED, alignment=TA_CENTER))],
                 [Paragraph('R$ 15.000 — R$ 22.000', ST['big_price'])],
                 [Paragraph(
                     'Investigacao remota sem acesso ao console  |  Hardware proprietario EngFlex  |  '
                     'Assets de audio profissionais  |  2 instaladores producao',
                     ST['price_note'])]]
    pb = Table(price_box, colWidths=[cw])
    pb.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_CARD),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (0, 0), 5*mm),
        ('BOTTOMPADDING', (0, -1), (0, -1), 5*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 8*mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8*mm),
        ('BOX', (0, 0), (-1, -1), 1, C_RED),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(pb)
    story.append(Spacer(1, 10*mm))

    # Entregaveis
    story.append(section('ENTREGAVEIS'))
    story.append(Spacer(1, 2*mm))
    deliverables = [
        'S-FIGHT-PRO-Setup-1.1.0.exe — Instalador Windows (modos arcade/festival)',
        'SPE-Sulsport-Setup-1.1.0.exe — Instalador Windows (modo campeonato)',
        'Codigo-fonte completo com 104 testes automatizados',
        'Pipeline CI/CD configurado (GitHub Actions)',
        'Documentacao tecnica (CHANGELOG, Release Checklist, Definition of Done)',
        '22 efeitos sonoros profissionais (ElevenLabs)',
        'Dockerfile + docker-compose para deploy web',
    ]
    for i, d in enumerate(deliverables, 1):
        story.append(Paragraph(f'<font color="#E11D48">{i}.</font>  {d}', ST['body']))

    doc.build(story, onFirstPage=bg_page, onLaterPages=bg_page)
    print(f'PDF: {out}')
    return out


if __name__ == '__main__':
    build()
