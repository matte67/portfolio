"""Edit-ready physical references to the portfolio case studies."""

from math import sin

from geometry import box, curve, label, tube
from projects import display_panel, project_plinth


def _badge(group, palette, title, x, y, width):
    box(group, f'{title} / targa', (x, y, 0.37), (width, 0.20, 0.48), palette['dark'])
    label(group, f'{title} / nome', title, (x, y-0.108, 0.37), 0.29, palette['ivory'])


def build_rewild_detail(group, palette):
    """Reference the touchable habitat from the RE:WILD concept."""
    x, y = 2.18, -2.58
    box(group, 'RE:WILD / parete dell’habitat', (x, y, 1.04), (1.76, 0.24, 1.16), palette['sage'])
    for i, (height, color) in enumerate(((0.28, 'gold'), (0.59, 'sage_pale'), (0.39, 'terracotta'))):
        xx = x-0.57+i*0.52
        box(group, 'RE:WILD / zona dell’habitat', (xx, y-0.135, 0.59+height/2),
            (0.46, 0.052, height), palette[color])
        tube(group, 'RE:WILD / punto di contatto', (xx, y-0.167, 0.96), (xx, y-0.179, 0.96),
             0.065, palette['ivory'], sides=12)
    label(group, 'RE:WILD / nome sulla parete', 'RE:WILD', (x, y-0.129, 1.39), 0.30, palette['ivory'])


def build_spazio_detail(group, palette):
    """Set a TV launcher with its remote beside the analog projection."""
    x = 2.25
    front, z = display_panel(group, palette, 'Spazio / Android TV', x, -1.14, 2.31, 1.42, 'basalt')
    for i, color in enumerate(('terracotta', 'sage', 'gold')):
        box(group, 'Spazio / riquadro app', (x-0.63+i*0.63, front, z-0.15),
            (0.51, 0.046, 0.41), palette[color])
    label(group, 'Spazio / nome sullo schermo', 'Spazio', (x-0.60, front-0.024, z+0.35), 0.29, palette['ivory'])
    box(group, 'Spazio / ripiano', (x, -1.50, 0.63), (2.54, 0.82, 0.13), palette['cliff'])
    box(group, 'Spazio / telecomando', (x+0.04, -2.31, 0.68), (0.39, 0.78, 0.12), palette['dark'], -0.18)
    tube(group, 'Spazio / tasto direzionale', (x, -2.27, 0.74), (x, -2.27, 0.765), 0.106, palette['ivory'], sides=14)


def build_hackhub_detail(group, palette):
    """Represent the academic project through a hackathon event board."""
    x, y = -1.16, 0.02
    box(group, 'HackHub / bacheca', (x, y, 1.23), (2.60, 0.24, 1.80), palette['sage'])
    label(group, 'HackHub / nome sulla bacheca', 'HackHub', (x, y-0.129, 1.82), 0.40, palette['ivory'])
    for i, title in enumerate(('TEAM', 'SUBMISSION', 'GIURIA')):
        xx = x-0.80+i*0.80
        box(group, 'HackHub / foglio su bacheca', (xx, y-0.137, 1.12), (0.72, 0.051, 0.73), palette['ivory'])
        label(group, f'HackHub / {title}', title, (xx, y-0.168, 1.30), 0.10, palette['dark'])
        for j in range(2):
            box(group, 'HackHub / riga', (xx-0.05*j, y-0.170, 1.13-0.149*j),
                (0.50-0.09*j, 0.018, 0.019), palette['terracotta'])


def build_sef_detail(group, palette):
    """Show independent video stages and the signal they extract."""
    x = 1.40
    front, z = display_panel(group, palette, 'SEF / monitor', x, 0.13, 2.90, 1.55, 'sage')
    label(group, 'SEF / sigla sul monitor', 'SEF', (x-0.89, front-0.027, z+0.48), 0.30, palette['ivory'])
    for i, color in enumerate(('dust', 'gold', 'amber')):
        xx = x-0.94+i*0.95
        box(group, 'SEF / modulo della pipeline', (xx, front-0.018, z+0.07), (0.77, 0.050, 0.24), palette[color])
    points = [(x-1.15+0.095*i, front-0.045, z-0.41+0.113*sin(0.79*i)+0.042*sin(2.10*i)) for i in range(25)]
    curve(group, 'SEF / segnale risultante', points, palette['ivory'], thickness=0.017)
    box(group, 'SEF / supporto del monitor', (x, 0.31, 0.64), (0.26, 0.38, 1.29), palette['dark'])


def _recipe(group, palette, x):
    box(group, 'Boccone / banco ricette', (x, -0.06, 0.50), (2.66, 1.69, 1.0), palette['cliff'])
    for side in (-1, 1):
        xx = x+side*0.47
        box(group, 'Boccone / pagina del ricettario', (xx, -0.13, 1.08), (0.91, 1.12, 0.13), palette['ivory'])
        for i in range(4):
            box(group, 'Boccone / riga della ricetta', (xx, -0.49+0.19*i, 1.151),
                (0.63-0.076*i, 0.034, 0.016), palette['sage'])
    for i in range(3):
        xx = x-0.67+0.31*i
        tube(group, 'Boccone / ingredienti', (xx, 0.65, 1.0), (xx, 0.65, 1.23), 0.16,
             palette['terracotta' if i % 2 else 'gold'], sides=10, tip=0.10)


def _basket(group, palette, x):
    box(group, 'Spesino / fondo della cesta', (x, 0.08, 0.45), (2.44, 1.49, 0.34), palette['sage'])
    for i in range(3):
        z = 0.72+0.22*i
        for side in (-1, 1):
            box(group, 'Spesino / doghe della cesta', (x, 0.08+side*0.72, z),
                (2.37, 0.12, 0.13), palette['sage'])
            box(group, 'Spesino / lati della cesta', (x+side*1.14, 0.08, z),
                (0.13, 1.45, 0.13), palette['sage'])
    box(group, 'Spesino / pacco della spesa', (x+0.40, 0.29, 1.10), (0.66, 0.72, 1.14), palette['gold'], 0.08)
    box(group, 'Spesino / lista della spesa', (x-0.33, -0.61, 1.29), (0.79, 0.14, 1.05), palette['ivory'])
    for i in range(3):
        z = 1.55-i*0.24
        box(group, 'Spesino / prodotto in lista', (x-0.26, -0.69, z), (0.49, 0.022, 0.044), palette['sage'])
        box(group, 'Spesino / spunta', (x-0.58, -0.692, z), (0.093, 0.027, 0.087), palette['terracotta'])


def build_nodale(group, palette):
    """Connect recipes, the common account and grocery lists across one island."""
    _recipe(group, palette, -3.22)
    _basket(group, palette, 1.95)
    front, z = display_panel(group, palette, 'Nodale / portale di accesso', -0.65, 1.34, 2.74, 2.52, 'ivory')
    label(group, 'Nodale / identità comune', 'nodale.', (-0.65, front-0.02, z+0.55), 0.49, palette['dark'])
    label(group, 'Nodale / account comune', 'UN ACCOUNT', (-0.65, front-0.02, z+0.14), 0.19, palette['dark'])
    box(group, 'Nodale / sostegno del portale', (-0.65, 1.36, 0.37), (0.29, 0.42, 0.74), palette['dark'])
    for x, title, color in ((-1.24, 'RICETTE', 'rose'), (-0.06, 'SPESA', 'sage')):
        box(group, 'Nodale / destinazione', (x, front-0.033, z-0.54), (1.02, 0.085, 0.50), palette[color])
        label(group, f'Nodale / {title}', title, (x, front-0.084, z-0.54), 0.14, palette['ivory'])
    _badge(group, palette, 'Boccone', -3.22, -1.61, 2.47)
    _badge(group, palette, 'Spesino', 1.95, -1.27, 2.47)
    curve(group, 'Nodale / percorso tra ricetta e spesa', [(-3.22, 0.92, 0.10), (-2.89, 1.99, 0.10),
                                                        (1.62, 1.99, 0.10), (1.95, 0.91, 0.10)],
          palette['gold'], thickness=0.050)


def _pastry_case(group, palette):
    box(group, 'Prenivo / ripiano laboratorio', (-2.08, 0.28, 0.90), (3.28, 1.94, 1.79), palette['cliff'])
    for row in range(2):
        y = -0.18+row*0.74
        for i in range(4):
            x = -3.17+i*0.66
            tube(group, 'Prenivo / pasticceria', (x, y, 1.79), (x, y, 1.94), 0.27, palette['gold'], sides=10, tip=0.23)
            tube(group, 'Prenivo / glassa', (x, y, 1.94), (x, y, 2.015), 0.205,
                 palette['terracotta' if i % 2 else 'ivory'], sides=10, tip=0.14)
    box(group, 'Prenivo / ordine da ritirare', (-2.06, -0.721, 1.24), (2.14, 0.10, 0.59), palette['ivory'])
    label(group, 'Prenivo / stato del ritiro', 'PRONTO AL RITIRO', (-2.06, -0.780, 1.24), 0.20, palette['dark'])


def _salon_agenda(group, palette):
    x = 1.84
    front, z = display_panel(group, palette, 'Prenivo / agenda salone', x, 1.02, 4.10, 2.56, 'ivory')
    for i in range(4):
        xx = x-1.43+i*0.86
        box(group, 'Prenivo / corsia operatore', (xx, front, z-0.04), (0.03, 0.024, 1.53), palette['stone'])
        for j in range(2):
            box(group, 'Prenivo / appuntamento', (xx+0.34, front-0.013, z+0.38-j*0.66-i%2*0.22),
                (0.68, 0.053, 0.34+i%2*0.1), palette['sage' if j else 'terracotta'])
    label(group, 'Prenivo / nome agenda', 'AGENDA SALONE', (x, front-0.027, z+0.86), 0.29, palette['dark'])


def build_prenivo(group, palette):
    """Show bakery production and pickup alongside the salon calendar."""
    project_plinth(group, palette, 'prenivo.', 'PRODUZIONE E RITIRI · AGENDA SALONE', y=-1.68, width=7.20)
    _pastry_case(group, palette)
    _salon_agenda(group, palette)
