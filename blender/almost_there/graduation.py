"""Graduation, the SEF thesis and the same-year English course in London."""

from math import cos, pi, sin

from geometry import box, curve, label, mesh, tube


TOWER_PROFILE = (0.64, 0.76, 0.88, 0.97, 1.04, 1.09, 1.12, 1.12,
                 1.10, 1.05, 0.98, 0.90, 0.78, 0.65, 0.50, 0.34, 0.18, 0.045)
TOWER_SIDES = 24


def _gherkin(group, palette, x, y):
    vertices = []
    for level, radius in enumerate(TOWER_PROFILE):
        for i in range(TOWER_SIDES):
            a = 2*pi*(i + level*0.5)/TOWER_SIDES
            vertices.append((x+radius*1.43*cos(a), y+radius*1.43*sin(a), 0.23+level*0.41))
    faces, colors = [], []
    for level in range(len(TOWER_PROFILE)-1):
        for i in range(TOWER_SIDES):
            lower = level*TOWER_SIDES
            upper = lower+TOWER_SIDES
            nxt = (i+1) % TOWER_SIDES
            prev = (i-1) % TOWER_SIDES
            faces.extend(((lower+i, lower+nxt, upper+i), (upper+prev, lower+i, upper+i)))
            band = (i-2*level) % 8
            colors.extend((0, 0) if band < 2 else ((2, 1) if (i+level) % 3 else (1, 2)))
    faces.append(tuple(range(len(vertices)-TOWER_SIDES, len(vertices))))
    colors.append(0)
    glazing = (palette['glass_deep'], palette['glass_mid'], palette['glass_light'])
    mesh(group, 'Londra / Gherkin, vetrate triangolari', vertices, faces, glazing, colors)
    for direction in (0, -1):
        for start in range(TOWER_SIDES):
            points = [vertices[level*TOWER_SIDES+(start+direction*level) % TOWER_SIDES]
                      for level in range(len(TOWER_PROFILE))]
            curve(group, 'Londra / reticolo diagonale', points, palette['metal'], thickness=0.014)
    tube(group, 'Londra / basamento circolare', (x, y, 0.06), (x, y, 0.24), 1.16, palette['limestone'], sides=24)
    tube(group, 'Londra / fascia panoramica', (x, y, 5.79), (x, y, 5.82), 0.95, palette['metal'], sides=28)


def _laurel(group, palette, x, y, z):
    for side in (-1, 1):
        branch = [(x+side*0.66*sin(a), y, z-0.64*cos(a))
                  for a in (i*0.20 for i in range(12))]
        curve(group, 'Laurea / ramo d’alloro', branch, palette['sage'], thickness=0.027)
        for i in range(2, len(branch)-1):
            xx, yy, zz = branch[i]
            for face in (-1, 1):
                points = [(xx, yy, zz), (xx+side*face*0.14, yy-0.017, zz+0.07),
                          (xx+side*face*0.22, yy, zz+0.21), (xx+side*face*0.05, yy+0.017, zz+0.16)]
                mesh(group, 'Laurea / foglia di alloro', points, ((0, 1, 2, 3),),
                     (palette['sage'] if i % 2 else palette['sage_pale'],))
    box(group, 'Laurea / nastro dell’alloro', (x, y-0.042, z-0.63), (0.24, 0.09, 0.13), palette['terracotta'])


def build_graduation(group, palette):
    """Place the thesis and laurel in front of the London Gherkin."""
    _gherkin(group, palette, 1.71, 2.86)
    box(group, 'Londra / targa del corso d’inglese', (2.90, 0.52, 0.33), (2.94, 0.35, 0.57), palette['glass_deep'])
    label(group, 'Londra / corso di inglese', 'LONDRA · CORSO D’INGLESE', (2.90, 0.333, 0.338), 0.205, palette['ivory'])
    box(group, 'Laurea / supporto tesi', (-0.59, -2.60, 0.56), (3.96, 1.23, 1.10), palette['limestone'])
    label(group, 'Laurea / traguardo', 'LAUREA TRIENNALE', (-0.58, -3.230, 0.67), 0.32, palette['dark'])
    box(group, 'Tesi SEF / pagine', (-0.43, -2.41, 2.13), (1.64, 0.27, 2.04), palette['ivory'])
    for dy in (-0.16, 0.16):
        box(group, 'Tesi SEF / copertina', (-0.43, -2.41+dy, 2.13),
            (1.74, 0.061, 2.14), palette['rose'])
    label(group, 'Tesi SEF / sigla', 'SEF', (-0.43, -2.611, 2.47), 0.51, palette['gold'])
    label(group, 'Tesi SEF / frontespizio', 'TESI DI LAUREA', (-0.43, -2.611, 1.96), 0.18, palette['ivory'])
    _laurel(group, palette, -1.97, -2.99, 1.88)
    tube(group, 'Laurea / pergamena', (0.41, -2.72, 1.23), (1.31, -2.88, 1.23),
         0.13, palette['ivory'], sides=14)
    tube(group, 'Laurea / nastro pergamena', (0.82, -2.793, 1.23), (0.92, -2.811, 1.23),
         0.137, palette['terracotta'], sides=14)
