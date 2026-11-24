"""Childhood, Camerino and Politecnico vignettes using editable local geometry."""

from math import pi

import bpy

from football import build_football, football
from geometry import box, collection, curve, label, mesh, tube


def _book(group, palette, center, size, color, angle=0.0):
    x, y, z = center
    width, depth, thickness = size
    box(group, 'Libro / pagine', center, (width, depth, thickness), palette['ivory'], angle)
    for dz in (-thickness / 2, thickness / 2):
        box(group, 'Libro / copertina', (x, y, z+dz), (width+0.065, depth+0.07, 0.041),
            palette[color], angle)


def _house(group, palette, x, y):
    wall = palette['dust']
    clay = palette['terracotta']
    box(group, 'Casa / intonaco', (x, y, 1.15), (3.05, 2.40, 2.30), wall)
    points = [(x+dx, y+dy, z) for dy in (-1.40, 1.40)
              for dx, z in ((-1.72, 2.20), (1.72, 2.20), (0.04, 3.55))]
    mesh(group, 'Casa / tetto a capanna', points, ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1),
                                                 (1, 4, 5, 2), (2, 5, 3, 0)), (clay,))
    box(group, 'Casa / ingresso', (x+0.06, y-1.24, 0.62), (0.74, 0.09, 1.26), palette['rose'])
    for dx in (-0.95, 0.96):
        box(group, 'Casa / finestra accesa', (x+dx, y-1.25, 1.28), (0.56, 0.12, 0.68), palette['amber'])
        box(group, 'Casa / traversa della finestra', (x+dx, y-1.32, 1.28), (0.58, 0.04, 0.047), palette['rose'])
    photo_x = x+1.12
    box(group, 'Famiglia / cornice', (photo_x, y-1.74, 0.69), (1.09, 0.16, 1.24), palette['gold'])
    box(group, 'Famiglia / fotografia', (photo_x, y-1.84, 0.69), (0.92, 0.025, 1.04), palette['ivory'])
    for dx, scale in ((-0.25, 1.0), (0.03, 0.72), (0.28, 0.94)):
        z = 0.44 + scale*0.45
        tube(group, 'Famiglia / sagoma nella foto', (photo_x+dx, y-1.863, z), (photo_x+dx, y-1.875, z),
             scale*0.087, palette['rose'], sides=12)
        box(group, 'Famiglia / spalle nella foto', (photo_x+dx, y-1.87, z-0.21*scale),
            (scale*0.164, 0.029, scale*0.27), palette['rose'])


def _kindergarten(group, palette):
    box(group, 'Scuola dell’infanzia / parete', (1.55, -0.65, 1.12), (3.45, 0.72, 2.23), palette['ivory'])
    box(group, 'Scuola dell’infanzia / tetto', (1.55, -0.66, 2.32), (3.77, 1.00, 0.22), palette['sage'])
    label(group, 'Scuola dell’infanzia / insegna', 'SCUOLA DELL’INFANZIA', (1.56, -1.025, 1.86),
          0.18, palette['dark'])
    for i, color in enumerate(('terracotta', 'sage', 'gold')):
        x = 0.63 + i*0.9
        box(group, 'Scuola dell’infanzia / vetrata', (x, -1.025, 1.05), (0.65, 0.03, 0.68), palette[color])
        box(group, 'Scuola dell’infanzia / cubo di legno', (x-0.44, -2.05 + i*0.36, 0.28 + i*0.15),
            (0.58, 0.58, 0.56+i*0.3), palette[color], angle=(-0.14+i*0.24))
    for i, color in enumerate(('rose', 'sage', 'gold')):
        x = 1.24 + i*0.28
        tube(group, 'Scuola dell’infanzia / matita', (x, -2.96, 0.09), (x+0.17, -2.28, 0.09),
             0.056, palette[color], sides=6, tip=0.049)


def build_childhood(group, palette):
    """Bring a model home and preschool forward, with the original stadium behind."""
    stadium = collection('Stadio e monumento numero 7', group)
    build_football(stadium, palette, ball_center=(7.4, -11.0, 3.05))
    pivot = bpy.data.objects.new('Stadio / scala e posizione', None)
    stadium.objects.link(pivot)
    for item in stadium.objects:
        if item != pivot:
            item.parent = pivot
    pivot.location = (0.1, 4.40, 0.03)
    pivot.scale = (0.49,) * 3
    _house(group, palette, -2.3, -2.5)
    _kindergarten(group, palette)


def _boots(group, palette, x, y):
    box(group, 'Scarpini / asse di legno', (x, y+0.15, 1.66), (2.31, 0.46, 3.2), palette['cliff'])
    tube(group, 'Scarpini / chiodo', (x, y, 2.88), (x, y-0.34, 2.91),
         0.054, palette['dark'], sides=6, tip=0.095)
    for side in (-1, 1):
        sx = x + side*0.34
        z = 1.34 + side*0.14
        vertices = [(sx+dx, y+dy, z+dz) for dy in (-0.46, -0.10)
                    for dx, dz in ((-0.22, 0.5), (0.24, 0.53), (0.25, -0.52),
                                   (0.08, -0.69), (-0.22, -0.58), (-0.28, -0.12))]
        faces = [tuple(reversed(range(6))), tuple(range(6, 12))]
        faces += [(i, (i+1) % 6, (i+1) % 6+6, i+6) for i in range(6)]
        mesh(group, 'Scarpino / tomaia', vertices, faces, (palette['dark'], palette['rose']), (0, 0, 0, 0, 1, 1, 1, 0))
        curve(group, 'Scarpino / laccio appeso al chiodo', [(x, y-0.31, 2.91), (sx+side*0.13, y-0.47, 2.57),
                                                         (sx+0.12, y-0.49, z+0.29)],
              palette['ivory'], thickness=0.025)
        for index in range(5):
            box(group, 'Scarpino / laccio', (sx, y-0.477, z+0.23-index*0.12),
                (0.29, 0.053, 0.048), palette['ivory'], angle=side*pi/24)
        for index in range(3):
            box(group, 'Scarpino / tacchetto', (sx-0.27, y-0.24, z-0.13-index*0.18),
                (0.16, 0.14, 0.073), palette['gold'])


def build_football_memorabilia(group, palette):
    """Keep the football equipment visible beside the Camerino entrance."""
    _boots(group, palette, 3.57, -0.42)
    for center, size in (((2.23,-2.65,0.54),0.54), ((4.47,-1.85,0.47),0.47), ((4.12,-2.55,0.29),0.29)):
        football(group, palette, center, size)


def build_amandola_school(group, palette):
    """Represent the secondary-school diploma through personal-scale objects."""
    x, y = -1.18, -2.04
    box(group, 'Diploma / panca', (x, y+0.17, 0.44), (2.06, 0.94, 0.88), palette['cliff'])
    box(group, 'Diploma / cornice', (x, y, 1.34), (1.84, 0.16, 0.91), palette['brick_dark'])
    box(group, 'Diploma / pergamena', (x, y-0.091, 1.34), (1.65, 0.042, 0.74), palette['ivory'])
    label(group, 'Diploma / iscrizione', 'DIPLOMA', (x, y-0.118, 1.51), 0.25, palette['dark'])
    label(group, 'Diploma / scuole superiori', 'SCUOLE SUPERIORI', (x, y-0.118, 1.26), 0.125, palette['dark'])
    tube(group, 'Diploma / sigillo', (x, y-0.13, 1.06), (x, y-0.116, 1.06),
         0.076, palette['terracotta'], sides=16)
    for index, color in enumerate(('sage', 'terracotta', 'basalt')):
        _book(group, palette, (0.56, -2.34, 0.19+0.17*index), (0.81, 0.63, 0.13), color, 0.13*index)


def build_study_desk(group, palette):
    """Prepare the focused study arrangement in front of the Politecnico facade."""
    box(group, 'Studio / scrivania', (0, -1.48, 1.15), (4.9, 2.16, 0.18), palette['cliff'])
    for x in (-2.18, 2.18):
        box(group, 'Studio / sostegno', (x, -1.43, 0.56), (0.22, 1.86, 1.12), palette['dark'])
    for index, color in enumerate(('rose', 'sage', 'basalt', 'terracotta')):
        _book(group, palette, (-1.64, -1.44, 1.30+index*0.19), (1.16, 0.9, 0.16), color, index*pi/30)
    for x in (-0.48, 0.45):
        box(group, 'Studio / quaderno aperto', (x, -1.89, 1.28), (0.88, 1.04, 0.055), palette['ivory'])
        for i in range(5):
            box(group, 'Studio / annotazioni', (x, -2.25+i*0.16, 1.314),
                (0.65-i*0.035, 0.024, 0.006), palette['basalt'])
    tube(group, 'Studio / lampada', (1.70, -1.13, 1.26), (1.75, -1.08, 2.77), 0.07, palette['dark'], sides=8)
    tube(group, 'Studio / paralume', (1.75, -1.08, 2.79), (1.18, -1.41, 2.53), 0.12,
         palette['dark'], tip=0.36, sides=12)
    tube(group, 'Studio / luce concentrata', (1.18, -1.42, 2.519), (1.16, -1.43, 2.503), 0.27,
         palette['amber'], sides=12)
    tube(group, 'Studio / cono di luce', (1.12, -1.43, 2.47), (0.27, -1.83, 1.28), 0.25,
         palette['beam'], sides=10, tip=0.74)
