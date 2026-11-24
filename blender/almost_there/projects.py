"""Portfolio vignettes based on the UniStays and Dormant Access Control case studies."""

from math import pi, radians

import bpy
from mathutils import Vector

from geometry import box, collection, curve, label, mesh, tube


def project_plinth(group, palette, title, subtitle, y=-1.60, width=6.3):
    """Place a physical caption below a collection of project props."""
    box(group, f'{title} / basamento', (0, y, 0.40), (width, 0.44, 0.79), palette['dark'])
    label(group, f'{title} / titolo', title, (0, y-0.231, 0.56), 0.37, palette['ivory'])
    label(group, f'{title} / dettaglio', subtitle, (0, y-0.232, 0.25), 0.19, palette['dust'])


def display_panel(group, palette, name, x, y, width, height, fill):
    """Place a vertical display and return its front face and center height."""
    z = height/2 + 0.74
    box(group, f'{name} / telaio', (x, y, z), (width, 0.39, height), palette['dark'])
    box(group, f'{name} / superficie', (x, y-0.21, z), (width-0.23, 0.058, height-0.24), palette[fill])
    return y - 0.253, z


def _map(group, palette, x, y):
    front, z = display_panel(group, palette, 'UniStays / mappa', x, y, 4.0, 2.55, 'sage_pale')
    for road in (((-1.76,-0.90),(-1.04,-0.54),(-0.22,-0.46),(0.58,0.03),(1.86,0.12)),
                 ((-1.60,0.97),(-0.84,0.56),(-0.46,-0.12),(-0.06,-1.14)),
                 ((0.51,1.12),(0.03,0.61),(0.23,-0.43),(0.86,-1.10)),
                 ((-1.73,0.29),(-1.01,0.27),(-0.42,0.45),(1.63,0.75))):
        curve(group, 'UniStays / strada sulla mappa', [(x+dx, front, z+dz) for dx, dz in road],
              palette['ivory'], thickness=0.035)
    for dx, dz in ((-1.19, 0.27), (-0.56,-0.54), (0.58, 0.19), (1.22, 0.67)):
        tube(group, 'UniStays / pin', (x+dx, front-0.013, z+dz), (x+dx, front-0.06, z+dz),
             0.13, palette['terracotta'], sides=16)
        tip = [(x+dx-0.11, front-0.066, z+dz-0.055), (x+dx, front-0.066, z+dz-0.23),
               (x+dx+0.11, front-0.066, z+dz-0.055)]
        mesh(group, 'UniStays / punta del pin', tip, ((0, 1, 2),), (palette['terracotta'],))


def _bed(group, palette, x, y):
    for side in (-1, 1):
        for end in (-1, 1):
            box(group, 'UniStays / piede del letto', (x+side*0.80, y+end*0.82, 0.28),
                (0.16, 0.19, 0.55), palette['cliff'])
    box(group, 'UniStays / letto di una stanza', (x, y, 0.55), (1.94, 2.12, 0.27), palette['ivory'])
    box(group, 'UniStays / coperta', (x, y-0.31, 0.72), (1.98, 1.47, 0.18), palette['sage'])
    box(group, 'UniStays / cuscino', (x, y+0.65, 0.78), (1.20, 0.49, 0.18), palette['bright'])
    box(group, 'UniStays / testiera', (x, y+1.05, 0.89), (2.03, 0.15, 1.4), palette['cliff'])


def build_unistays(group, palette):
    """Show room search, the rental space and the chat invitation on one island."""
    project_plinth(group, palette, 'UniStays', 'STANZE · COINQUILINI · INVITI IN CHAT', y=-2.10, width=7.80)
    _map(group, palette, -1.95, 1.15)
    _bed(group, palette, 0.65, 0.48)
    _invitation(group, palette)


def _invitation(group, palette):
    x = 2.24
    front, z = display_panel(group, palette, 'UniStays / conversazione e profilo', x, 2.70, 2.91, 2.63, 'ivory')
    for i, (dx, width, color) in enumerate(((-0.38,1.41,'sage'), (0.44,1.20,'stone'), (-0.05,2.45,'sage_pale'))):
        top = z+0.74-i*0.68
        box(group, 'UniStays / messaggio o scheda invito', (x+dx, front-0.021, top),
            (width, 0.076, 0.43 if i < 2 else 0.63), palette[color])
        if i < 2:
            box(group, 'UniStays / riga del messaggio', (x-0.06+dx, front-0.066, top),
                (width*0.65, 0.027, 0.052), palette['ivory'])
    label(group, 'UniStays / invito a una stanza', 'INVITO A UNA STANZA', (x-0.05, front-0.069, z-0.58),
          0.17, palette['dark'])


def _nano(group, palette):
    x, y, z = -0.88, -0.44, 1.07
    box(group, 'Arduino Nano / circuito stampato', (x, y, z), (3.52, 1.68, 0.15), palette['pcb'], -0.15)
    box(group, 'Arduino Nano / connettore USB', (x-1.45, y+0.20, z+0.19), (0.68, 0.81, 0.32), palette['metal'], -0.15)
    box(group, 'Arduino Nano / corpo del microcontrollore', (x+0.17, y-0.03, z+0.13),
        (0.68, 0.63, 0.14), palette['dark'], pi/4)
    for side in (-1, 1):
        for index in range(13):
            dx = -1.46 + 0.24*index
            yy = y + side*0.66-0.15*dx
            box(group, 'Arduino Nano / connettore di bordo', (x+dx, yy, z+0.16),
                (0.12, 0.14, 0.20), palette['gold'], -0.15)
    for i in range(6):
        tube(group, 'Arduino Nano / traccia sul circuito', (x-0.55+i*0.17, y-0.23, z+0.087),
             (x-0.53+i*0.17, y-0.53, z+0.087), 0.019, palette['metal'], sides=4)
    box(group, 'Arduino Nano / LED', (x+0.96, y+0.06, z+0.15), (0.17, 0.10, 0.097), palette['amber'])


def build_arduino(group, palette):
    """Show a Nano on a workbench beside the project's proximity and Morse interfaces."""
    project_plinth(group, palette, 'Dormant Access Control Unit', 'ARDUINO NANO · PROSSIMITÀ · MORSE',
                   y=-2.50, width=7.35)
    box(group, 'Accesso / piano di lavoro', (0.14, -0.05, 0.49), (6.7, 4.10, 0.87), palette['cliff'])
    components = collection('Arduino Nano / componenti', group)
    _nano(components, palette)
    center = Vector((-0.88, -0.44, 1.07))
    pivot = bpy.data.objects.new('Arduino Nano / appoggio sul banco', None)
    components.objects.link(pivot)
    for item in components.objects:
        if item != pivot:
            item.parent = pivot
            item.location -= center
    pivot.location = center + Vector((0, 0, 0.11))
    pivot.rotation_euler.x = radians(15)
    box(group, 'Accesso / sensore a ultrasuoni', (2.16, 0.53, 1.58), (2.00, 0.32, 1.06), palette['pcb'])
    for x in (1.65, 2.67):
        tube(group, 'Accesso / trasduttore metallico', (x, 0.13, 1.60), (x, 0.38, 1.60),
             0.34, palette['metal'], sides=16)
        tube(group, 'Accesso / griglia del trasduttore', (x, 0.11, 1.60), (x, 0.13, 1.60),
             0.22, palette['dark'], sides=16)
    box(group, 'Accesso / display', (-1.17, 1.33, 1.73), (2.90, 0.33, 0.80), palette['dark'])
    label(group, 'Accesso / display CIAO', 'CIAO', (-1.17, 1.154, 1.72), 0.53, palette['amber'])
    tube(group, 'Accesso / pulsante Morse', (2.27, -1.03, 0.94), (2.27, -1.03, 1.22),
         0.46, palette['terracotta'], sides=16)
    for i, color in enumerate(('terracotta', 'gold', 'dark')):
        curve(group, 'Accesso / cavetto', [(-0.28+i*0.19, 0.14, 1.16), (0.25+i*0.15, 0.68, 1.54),
                                        (0.91+i*0.17, 0.50, 1.31), (1.48+i*0.18, 0.49, 1.19)],
              palette[color], thickness=0.033)
