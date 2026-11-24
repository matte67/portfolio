"""Layered, distant architecture with an illuminated threshold."""

from math import cos, pi, sin

from geometry import box, curve, island, mesh, tube


def _gate(group, palette):
    for level, (width, depth) in enumerate(((28, 18), (25, 15), (22, 12), (19, 10))):
        box(group, f'Monument / terrace {level + 1}', (0, 2+level*0.40, 0.43+level*0.75),
            (width, depth, 0.87), palette['haze' if level % 2 == 0 else 'haze_shadow'])
    for level in range(7):
        box(group, 'Monument / stairs', (0, -12+level*1.21, -1.58 + level*0.54),
            (6.8, 2.4, 0.59), palette['haze'])
    for x in (-8.4, -5.6, -3.02, 3.02, 5.6, 8.4):
        for y in (-0.85, 7.0):
            box(group, 'Monument / footing', (x, y, 3.45), (1.81, 1.81, 0.49), palette['haze_shadow'])
            tube(group, 'Monument / column', (x, y, 3.6), (x, y, 11.2), 0.67, palette['haze'], sides=10, tip=0.53)
            box(group, 'Monument / capital', (x, y, 11.16), (1.62, 1.62, 0.36), palette['haze'])
    box(group, 'Monument / lintel', (0, 3, 11.95), (19.5, 9.76, 1.02), palette['haze'])
    box(group, 'Monument / cornice', (0, 3, 12.72), (20.45, 10.65, 0.52), palette['haze_shadow'])
    box(group, 'Monument / sanctuary', (0, 6.15, 7.06), (5.05, 1.8, 7.93), palette['rose'])
    box(group, 'Monument / glowing threshold', (0, 5.22, 6.55), (3.02, 0.08, 6.48), palette['portal'])
    box(group, 'Monument / deep door reveal', (0, 5.15, 6.6), (0.21, 0.09, 6.59), palette['gold'])
    for side in (-1, 1):
        tube(group, 'Monument / false beam', (side*0.95, 5, 5.3), (side*2.9, -8, 3.1),
             0.7, palette['beam'], sides=6, tip=2.6)


def _crest(group, palette):
    points = [(7.15*cos(a), 3.0+2.95*sin(a), 17.6 + 0.9*cos(2*a))
              for a in (2*pi*i/48 for i in range(48))]
    curve(group, 'Crest / floating ring', points, palette['gold'], thickness=0.17, closed=True)
    for index in range(15):
        angle = 2*pi*index/15
        radius = 7.1
        x, y = radius*cos(angle), 3.0+2.95*sin(angle)
        start = 17.6 + 0.9*cos(2*angle)
        height = 1.06 + 2.75*(0.5 + 0.5*sin(3*angle - pi/2))
        end = (x*1.09, (y-3)*1.07+3, start+height)
        tube(group, 'Crest / lifted blade', (x, y, start), end, 0.24, palette['haze'], tip=0.09, sides=4)
    for side in (-1, 1):
        for index in range(6):
            x = side*(3.5 + index*1.34)
            z = 14.5 + index*0.31
            profile = [(x, 1.7, z), (x+side*1.62, 1.95, z+0.49),
                       (x+side*1.78, 2.1, z+1.22), (x+side*0.42, 1.6, z+0.71)]
            mesh(group, 'Crest / laurel shard', profile, ((0, 1, 2, 3),), (palette['gold'],))


def build_monument(group, palette):
    """Create an isolated landmark with a layered approach and abstract crest."""
    layers = (palette['haze'], palette['haze_shadow'], palette['stone'], palette['cliff'])
    island(group, 'Monument / suspended bedrock', (0, 4, -0.08), (22, 16), 10.0, layers, 920, sides=17)
    _gate(group, palette)
    _crest(group, palette)
