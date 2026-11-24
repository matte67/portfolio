"""A compact cinema vignette built around one illuminated film frame."""

from math import cos, pi, sin

from geometry import box, mesh, tube


def _projector(group, palette):
    x, y, z = -1.92, -2.00, 1.56
    dark = palette['dark']
    for index in range(3):
        angle = -pi/2 + index*2*pi/3
        tube(group, 'Proiettore / cavalletto', (x+cos(angle)*0.70, y+sin(angle)*0.70, 0.1),
             (x, y, z-0.24), 0.058, dark, sides=6)
    box(group, 'Proiettore / corpo', (x, y, z), (1.42, 0.85, 0.97), dark)
    lens_base = (x+0.53, y+0.16, z+0.05)
    lens_end = (x+1.01, y+0.44, z+0.16)
    tube(group, 'Proiettore / obiettivo', lens_base, lens_end, 0.24, dark, sides=12, tip=0.36)
    tube(group, 'Proiettore / ghiera', lens_end, (x+1.08, y+0.50, z+0.18),
         0.34, palette['gold'], sides=12, tip=0.29)
    for offset, radius in ((-0.45, 0.57), (0.52, 0.44)):
        reel_x, reel_z = x+offset, z+0.72
        tube(group, 'Proiettore / bobina', (reel_x, y-0.38, reel_z), (reel_x, y+0.19, reel_z),
             radius, dark, sides=16)
        for index in range(5):
            angle = index*2*pi/5
            dx, dz = cos(angle)*radius*0.60, sin(angle)*radius*0.60
            tube(group, 'Proiettore / foro della bobina', (reel_x+dx, y-0.39, reel_z+dz),
                 (reel_x+dx, y-0.38, reel_z+dz), radius*0.19, palette['stone'], sides=10)
    tube(group, 'Proiettore / fascio sul fotogramma', (x+1.10, y+0.52, z+0.18), (0.99, 1.05, 2.22),
         0.24, palette['beam'], sides=10, tip=1.03)


def _film_frame(group, palette):
    box(group, 'Cinema / pedana', (0, 0, 0.13), (7.63, 6.45, 0.26), palette['dark'])
    box(group, 'Cinema / cornice di pellicola', (1.0, 1.24, 2.27), (4.75, 0.47, 3.35), palette['dark'])
    box(group, 'Cinema / fotogramma illuminato', (1.0, 0.98, 2.27), (3.65, 0.072, 2.66), palette['ivory'])
    for side in (-1, 1):
        for index in range(7):
            box(group, 'Cinema / perforazione', (1.0+side*2.08, 0.99, 1.02+0.41*index),
                (0.15, 0.045, 0.21), palette['dust'])
    for index in range(5):
        box(group, 'Cinema / soglia nel fotogramma', (0.97, 0.924-index*0.017, 1.02+index*0.16),
            (2.30-index*0.36, 0.022, 2.23-index*0.30), palette['rose' if index % 2 else 'terracotta'])
    box(group, 'Cinema / luce nel fotogramma', (0.97, 0.829, 1.89), (0.46, 0.03, 1.53), palette['amber'])
    for side in (-1, 1):
        root_x = 1.0 + side*2.22
        for fold in range(4):
            points = [(root_x+side*(fold*0.19+dx), 1.03+dy, z)
                      for dx, dy, z in ((0,0,0.36),(0.14,-0.18,0.43),(0.27,0,0.45),
                                         (-0.12,0,4.12),(0.01,-0.2,4.14),(0.14,0,4.13))]
            mesh(group, 'Cinema / lembo di velluto', points, ((0, 1, 4, 3), (1, 2, 5, 4)),
                 (palette['terracotta'], palette['rose']), (0, 1))


def build_cinema(group, palette):
    """Stage the beam, the projector and a single frame with a lit doorway."""
    _film_frame(group, palette)
    _projector(group, palette)
