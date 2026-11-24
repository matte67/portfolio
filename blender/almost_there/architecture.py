"""Procedural architectural landmarks based on the supplied facade references."""

from math import cos, pi, sin

from geometry import box, curve, label, mesh, tube


ARCH_SEGMENTS = 14


def _arch_profile(x, y, spring, radius, rise, *, power=1.0):
    return [(x+radius*cos(angle), y, spring+rise*sin(angle)**power)
            for angle in (pi*index/ARCH_SEGMENTS for index in range(ARCH_SEGMENTS+1))]


def _arch_wall(group, palette, x, y):
    spring, radius, rise, cornice = 2.21, 1.36, 1.56, 4.42
    depth = 1.75
    for side in (-1, 1):
        box(group, 'Amandola / piedritto', (x+side*1.89, y+depth/2, spring/2-0.08),
            (1.08, depth, spring+0.16), palette['brick'])
    for index in range(2):
        front = y+index*depth
        profile = _arch_profile(x, front, spring, radius, rise, power=0.77)
        vertices = profile + [(xx, yy, cornice) for xx, yy, _ in profile]
        count = len(profile)
        faces = [(i, i+1, i+1+count, i+count) for i in range(count-1)]
        mesh(group, 'Amandola / timpano sopra il passaggio', vertices, faces, (palette['brick'],))
        if not index:
            crown = _arch_profile(x, front-0.07, spring, radius+0.16, rise+0.02, power=0.77)
            curve(group, 'Amandola / ghiera in pietra', crown, palette['brick_trim'], thickness=0.098)
            wall = profile + [(xx, yy+depth, zz) for xx, yy, zz in profile]
            mesh(group, 'Amandola / volta del passaggio', wall, faces, (palette['brick_dark'],))
    for side in (-1, 1):
        box(group, 'Amandola / spalla superiore', (x+side*1.89, y+depth/2, (spring+cornice)/2),
            (1.08, depth, cornice-spring), palette['brick'])


def build_amandola_arch(group, palette):
    """Model the brick arch, clock, cornices, pinnacles and open bell gable."""
    x, y = -0.68, 1.68
    _arch_wall(group, palette, x, y)
    for side in (-1, 1):
        box(group, 'Amandola / edificio laterale', (x+side*3.04, y+0.96, 1.21),
            (1.33, 1.94, 2.48), palette['brick_trim'])
        box(group, 'Amandola / tetto laterale', (x+side*3.06, y+0.96, 2.48),
            (1.52, 2.06, 0.18), palette['roof'])
        box(group, 'Amandola / finestra laterale', (x+side*3.06, y-0.024, 1.63),
            (0.59, 0.045, 0.75), palette['ivory'])
        for i in range(6):
            box(group, 'Amandola / persiana', (x+side*3.06, y-0.05, 1.35+i*0.109),
                (0.54, 0.031, 0.037), palette['stone'])
        box(group, 'Amandola / ala della torre', (x+side*1.48, y+0.875, 4.79),
            (1.70, 1.75, 1.53), palette['brick'])
        tube(group, 'Amandola / oculo', (x+side*1.37, y-0.031, 5.15),
             (x+side*1.37, y-0.009, 5.15), 0.205, palette['brick_dark'], sides=16)
        tube(group, 'Amandola / oculo basso', (x+side*1.44, y-0.030, 4.00),
             (x+side*1.44, y-0.009, 4.00), 0.164, palette['brick_dark'], sides=16)
    box(group, 'Amandola / asse centrale della torre', (x, y+0.88, 4.97), (2.56, 1.77, 1.94), palette['brick'])
    for z, width in ((4.42, 4.91), (5.52, 4.91), (5.95, 2.78)):
        box(group, 'Amandola / cornice marcapiano', (x, y+0.88, z),
            (width, 1.96, 0.12), palette['brick_trim'])
    _clock(group, palette, x, y-0.023, 5.20)
    for side in (-1, 1):
        for dx, z in ((0.82, 6.05), (2.17, 5.55)):
            tube(group, 'Amandola / pinnacolo', (x+side*dx, y+0.23, z),
                 (x+side*dx, y+0.23, z+0.49), 0.16, palette['brick_dark'], sides=5, tip=0.032)
        box(group, 'Amandola / montante della cella', (x+side*0.34, y+0.33, 6.33),
            (0.11, 0.31, 0.65), palette['roof'])
    box(group, 'Amandola / architrave cella', (x, y+0.33, 6.67), (0.89, 0.48, 0.13), palette['roof'])
    tube(group, 'Amandola / campana', (x, y+0.27, 6.17), (x, y+0.27, 6.53),
         0.231, palette['gold'], sides=14, tip=0.098)
    box(group, 'Amandola / targa della porta', (x, y-0.055, 4.12), (1.50, 0.12, 0.26), palette['brick_dark'])
    label(group, 'Amandola / nome sulla porta', 'AMANDOLA', (x, y-0.124, 4.12), 0.19, palette['ivory'])


def _clock(group, palette, x, y, z):
    tube(group, 'Amandola / cornice orologio', (x, y-0.07, z), (x, y+0.02, z),
         0.53, palette['brick_dark'], sides=32)
    tube(group, 'Amandola / quadrante in pietra', (x, y-0.090, z), (x, y-0.050, z),
         0.43, palette['ivory'], sides=32)
    for i in range(12):
        a = 2*pi*i/12
        tube(group, 'Amandola / indice orologio', (x+0.34*cos(a),y-0.102,z+0.34*sin(a)),
             (x+0.39*cos(a),y-0.102,z+0.39*sin(a)), 0.013, palette['dark'], sides=5)
    for dx, dz in ((-0.17,-0.23), (0.13,0.33)):
        tube(group, 'Amandola / lancetta', (x, y-0.128, z), (x+dx, y-0.128, z+dz),
             0.020, palette['dark'], sides=6)


def _campus_flags(group, palette, x, y):
    for index, colors in enumerate((('sage', 'ivory', 'terracotta'), ('glass_deep', 'glass_deep', 'gold'))):
        xx = x+index*0.92
        tube(group, 'Camerino / asta della bandiera', (xx, y, 1.97), (xx+0.13, y-0.35, 3.45),
             0.024, palette['metal'], sides=6)
        for i, color in enumerate(colors):
            vertices = [(xx+0.10+i*0.13, y-0.44, 3.20), (xx+0.23+i*0.13, y-0.42, 3.15),
                        (xx+0.26+i*0.13, y-0.37, 2.63), (xx+0.13+i*0.13, y-0.39, 2.69)]
            mesh(group, 'Camerino / lembo bandiera', vertices, ((0, 1, 2, 3),), (palette[color],))


def build_camerino_campus(group, palette):
    """Model the modern entrance, glazed ribbon, limestone frame and canopy."""
    x, facade = -0.48, 2.66
    box(group, 'Camerino / corpo del campus', (x, facade+1.46, 2.40), (8.36, 2.96, 4.86), palette['ivory'])
    box(group, 'Camerino / fascia vetrata', (x+0.47, facade-0.047, 2.42), (6.86, 0.12, 4.31), palette['glass_deep'])
    for row in range(4):
        for i in range(13):
            xx = x-2.72+i*0.53
            color = ('glass_light', 'glass_mid', 'glass_deep')[(i+row*2+(i//4)) % 3]
            box(group, 'Camerino / specchiatura', (xx, facade-0.119, 0.87+row*1.01),
                (0.485, 0.058, 0.94), palette[color])
    for index in range(14):
        box(group, 'Camerino / montante in alluminio', (x-2.985+index*0.532, facade-0.156, 2.38),
            (0.039, 0.052, 4.15), palette['metal'])
    for index in range(5):
        box(group, 'Camerino / traverso in alluminio', (x+0.45, facade-0.158, 0.36+index*1.01),
            (6.92, 0.049, 0.042), palette['metal'])
    label(group, 'Camerino / insegna', 'UNIVERSITÀ DI CAMERINO', (x+0.28, facade-0.081, 4.68), 0.27, palette['dark'])
    shield_x = x-3.63
    vertices = [(shield_x+dx, facade-0.063, z) for dx, z in ((-0.36,3.88),(0.36,3.88),(0.35,3.24),(0,2.94),(-0.35,3.24))]
    mesh(group, 'Camerino / scudo del campus', vertices, ((0, 1, 2, 3, 4),), (palette['glass_deep'],))
    label(group, 'Camerino / sigla', 'UNICAM', (shield_x, facade-0.080, 3.48), 0.17, palette['ivory'])
    box(group, 'Camerino / pensilina', (x+1.31, facade-0.94, 2.68), (4.36, 2.15, 0.33), palette['limestone'])
    for xx in (x-0.64, x+3.26):
        box(group, 'Camerino / sostegno della pensilina', (xx, facade-1.74, 1.31),
            (0.24, 0.22, 2.62), palette['ivory'])
    for step in range(3):
        box(group, 'Camerino / gradinata di ingresso', (x+1.14, facade-2.20+step*0.39, 0.08+step*0.09),
            (4.11, 0.76, 0.16+step*0.16), palette['limestone'])
    _campus_flags(group, palette, x+0.78, facade-1.85)


def _arched_window(group, palette, x, y, base, height, width):
    radius = width/2
    rise = radius*0.81
    spring = base+height-rise
    profile = _arch_profile(x, y, spring, radius, rise)
    vertices = [(x+radius, y, base), *profile, (x-radius, y, base)]
    mesh(group, 'Politecnico / vano finestra', vertices, (tuple(range(len(vertices))),), (palette['glass_deep'],))
    curve(group, 'Politecnico / cornice ad arco', [(x+radius,y-0.017,base),
          *((xx, yy-0.017, zz) for xx, yy, zz in profile), (x-radius,y-0.017,base)],
          palette['limestone'], thickness=0.040)
    for side in (-1, 1):
        box(group, 'Politecnico / montante finestra', (x+side*radius*0.30, y-0.025, (base+spring)/2),
            (0.030, 0.042, spring-base), palette['stone'])
    for i in range(3):
        box(group, 'Politecnico / traverso finestra', (x, y-0.026, base+(i+1)*(spring-base)/4),
            (width*0.88, 0.037, 0.024), palette['stone'])


def _roofline(group, palette, y):
    for z, width in ((4.14, 9.12), (4.37, 9.30), (4.94, 9.18)):
        box(group, 'Politecnico / cornicione', (0, y+0.51, z), (width, 1.16, 0.15), palette['limestone'])
    for index in range(29):
        x = -4.20+0.30*index
        tube(group, 'Politecnico / balaustra', (x, y+0.06, 4.45), (x, y+0.06, 4.86),
             0.066, palette['ivory'], sides=8, tip=0.050)
    for side in (-1, 1):
        x = side*3.23
        curve(group, 'Politecnico / fastigio curvo', _arch_profile(x, y-0.07, 4.15, 1.07, 0.54),
              palette['ivory'], thickness=0.123)
        for xx in (x-0.68, x+0.68):
            tube(group, 'Politecnico / obelisco sul cornicione', (xx, y+0.16, 4.88), (xx, y+0.16, 5.58),
                 0.087, palette['limestone'], sides=4, tip=0.038)


def build_polimi_facade(group, palette):
    """Recreate the historic facade's two levels, relief and roof balustrade."""
    y = 2.20
    box(group, 'Politecnico / corpo storico', (0, y+1.04, 2.08), (8.95, 2.16, 4.19), palette['limestone'])
    for side in (-1, 1):
        box(group, 'Politecnico / avancorpo', (side*3.24, y-0.13, 2.05), (2.24, 0.37, 4.18), palette['ivory'])
    for i in range(9):
        x = -3.92+i*0.98
        face = y-(0.34 if abs(x) >= 2.94 else 0.060)
        _arched_window(group, palette, x, face, 2.44, 1.31, 0.53)
        if i in (2, 3, 4, 5, 6):
            _arched_window(group, palette, x, face, 0.39, 1.32, 0.58)
        else:
            box(group, 'Politecnico / zoccolo laterale', (x, face, 0.58), (0.67, 0.09, 0.94), palette['ivory'])
        if i < 8:
            column = x+0.49
            box(group, 'Politecnico / lesena', (column, face-0.043, 3.02), (0.112, 0.17, 1.76), palette['ivory'])
            box(group, 'Politecnico / capitello', (column, face-0.071, 3.88), (0.233, 0.22, 0.158), palette['stone'])
    for z in (0.23, 2.02, 2.19, 3.98):
        box(group, 'Politecnico / fascia orizzontale', (0, y+0.77, z), (9.09, 2.23, 0.12), palette['ivory'])
    _roofline(group, palette, y-0.32)
    for step in range(3):
        box(group, 'Politecnico / scalinata', (0, y-0.64+step*0.26, 0.05+step*0.07),
            (7.40, 0.55, 0.10+step*0.13), palette['stone'])
    box(group, 'Politecnico / targa', (0, y-0.37, 2.12), (3.65, 0.084, 0.35), palette['ivory'])
    label(group, 'Politecnico / iscrizione', 'POLITECNICO DI MILANO', (0, y-0.421, 2.124), 0.28, palette['brick_dark'])
