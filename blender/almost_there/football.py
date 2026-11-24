"""Procedural stadium, pentagon-panel football and number-seven monument."""

from math import atan2, cos, pi, sin

import bmesh
from mathutils import Vector

from geometry import box, curve, label, mesh, tube


def football(group, palette, center, radius):
    """Place an editable football made of the classic pentagon and hexagon panels."""
    base = bmesh.new()
    bmesh.ops.create_icosphere(base, subdivisions=1, radius=1.0)
    base.verts.index_update()
    normal = {v.index: v.co.normalized() for v in base.verts}
    triangles = [tuple(vertex.index for vertex in face.verts) for face in base.faces]
    base.free()
    directions = {}
    vertices = []
    faces = []
    for triangle in triangles:
        hexagon = []
        for a, b in zip(triangle, (*triangle[1:], triangle[0])):
            for key in ((a, b), (b, a)):
                if key not in directions:
                    v1, v2 = (normal[index] for index in key)
                    directions[key] = len(vertices)
                    vertices.append(tuple((v1 * 2 + v2).normalized() * radius))
                hexagon.append(directions[key])
        faces.append(tuple(hexagon))
    for index, axis in normal.items():
        east = axis.orthogonal().normalized()
        north = axis.cross(east)
        ring = [vertex for (a, _), vertex in directions.items() if a == index]
        faces.append(tuple(sorted(ring, key=lambda j: atan2(Vector(vertices[j]).dot(north),
                                                          Vector(vertices[j]).dot(east)))))
    ball = mesh(group, 'Football / truncated icosahedron', vertices, faces,
                (palette['bright'], palette['dark']), (0,) * 20 + (1,) * 12)
    ball.location = center
    ball.rotation_euler = (0.22, -0.25, 0.33)
    bevel = ball.modifiers.new('Soft panel edges', 'BEVEL')
    bevel.width = radius * 0.01
    bevel.segments = 1
    return ball


def _statue(group, palette):
    x, y = -4.7, 0.7
    for level, width in enumerate((4.4, 3.8, 3.15)):
        box(group, f'Idol / plinth step {level + 1}', (x, y, 0.27 + 0.51 * level),
            (width, 3.3 - 0.38 * level, 0.53), palette['dark' if level == 0 else 'stone'])
    pale = palette['ivory']
    dark = palette['basalt']

    def point(dx, dy, z):
        return x + dx, y + dy, z

    for side in (-1, 1):
        ankle = point(side * 1.58, -0.14, 1.95)
        knee = point(side * 1.09, 0.03, 3.80)
        hip = point(side * 0.56, 0.04, 5.52)
        box(group, 'Idol / boot', point(side * 1.58, -0.34, 1.72), (0.82, 1.30, 0.45), dark, side * 0.13)
        tube(group, 'Idol / shin', ankle, knee, 0.30, pale, sides=6, tip=0.43)
        tube(group, 'Idol / thigh', knee, hip, 0.44, pale, sides=6, tip=0.64)
        shoulder = point(side * 1.05, 0.02, 7.43)
        elbow = point(side * 1.62, -0.02, 6.27)
        hand = point(side * 2.22, -0.04, 5.50)
        tube(group, 'Idol / sleeve', shoulder, elbow, 0.48, pale, sides=6, tip=0.30)
        tube(group, 'Idol / forearm', elbow, hand, 0.32, pale, sides=6, tip=0.21)
    tube(group, 'Idol / shorts', point(0, 0, 4.99), point(0, 0, 5.74), 0.98, dark, sides=6)
    torso = tube(group, 'Idol / jersey', point(0, 0, 5.64), point(0, 0, 7.62), 0.86, pale, sides=6, tip=1.29)
    torso.scale.y = 0.58
    torso.rotation_euler.z = pi / 6
    tube(group, 'Idol / neck', point(0, 0, 7.52), point(0, 0, 8.15), 0.34, dark, sides=6)
    head = tube(group, 'Idol / head', point(0, -0.04, 8.03), point(0.06, 0.05, 9.47), 0.53, pale, sides=7, tip=0.47)
    head.rotation_euler.y += 0.1
    tube(group, 'Idol / hair', point(0.06, 0.05, 9.32), point(0.10, 0.15, 9.61), 0.50, dark, sides=7, tip=0.38)
    label(group, 'Idol / shirt number', '7', point(0, -0.69, 6.69), 1.08, palette['terracotta'])
    label(group, 'Idol / plinth engraving', '07', point(0, -1.31, 1.3), 0.4, palette['dark'])


def _stadium(group, palette):
    box(group, 'Stadium / turf', (0.8, 3.0, 0.16), (13.0, 13.0, 0.32), palette['grass'])
    outline = [(-4.5, -2.2, 0.34), (5.7, -2.2, 0.34), (5.7, 8.2, 0.34), (-4.5, 8.2, 0.34)]
    curve(group, 'Stadium / touchlines', outline, palette['ivory'], thickness=0.048, closed=True)
    center_circle = [(0.6 + 1.48*cos(a), 3.0 + 1.48*sin(a), 0.34)
                     for a in (i*pi/12 for i in range(24))]
    curve(group, 'Stadium / center circle', center_circle, palette['ivory'], thickness=0.042, closed=True)
    for row in range(5):
        radius = 6.2 + row * 0.72
        z = 0.52 + row * 0.40
        for section in range(9):
            angle = (section + 0.5) * pi / 9
            center = (radius*cos(angle) - 1.1, radius*0.75*sin(angle) + 3.5, z)
            box(group, f'Stadium / stand {row + 1}.{section + 1}', center,
                (radius * 0.31, 0.68, 0.55), palette['terracotta' if row % 3 == 1 else 'dust'], angle + pi/2)
    for left in (-1, 1):
        x = 0.75 + left * 7.4
        y = 6.6 if left == -1 else 3.2
        tube(group, 'Stadium / floodlight mast', (x, y, 0), (x, y, 8.1), 0.14, palette['dark'], sides=6)
        box(group, 'Stadium / floodlight housing', (x, y, 8.1), (2.55, 0.42, 1.35), palette['dark'])
        for column in range(4):
            for row in range(2):
                box(group, 'Stadium / floodlight', (x + (column - 1.5)*0.56, y-0.239, 7.83 + row*0.54),
                    (0.38, 0.05, 0.34), palette['lamp'])
    x0, x1, y, post_height = -0.75, 4.85, 0.55, 2.85
    for x in (x0, x1):
        tube(group, 'Goal / upright', (x, y, 0.34), (x, y, post_height), 0.075, palette['bright'])
        tube(group, 'Goal / net support', (x, y, post_height), (x, y+1.35, 0.45), 0.042, palette['dust'])
    tube(group, 'Goal / crossbar', (x0, y, post_height), (x1, y, post_height), 0.075, palette['bright'])
    for i in range(15):
        x = x0 + (x1 - x0) * i / 14
        curve(group, 'Goal / vertical netting', [(x, y, post_height), (x, y+0.65, 2.05), (x, y+1.35, 0.45)],
              palette['dust'], thickness=0.022)
    for j in range(8):
        fraction = j / 7
        a = (x0, y + 1.35*fraction, post_height - (post_height - 0.45)*fraction)
        curve(group, 'Goal / horizontal netting', [a, (x1, a[1], a[2])], palette['dust'], thickness=0.022)


def build_football(group, palette, *, ball_center=(3.0, -6.0, 3.05)):
    """Populate the football shelf with three readable silhouettes."""
    _stadium(group, palette)
    _statue(group, palette)
    x, y, z = ball_center
    football(group, palette, ball_center, 2.25)
    tube(group, 'Football pedestal', (x, y, 0), (x, y, z-2.20), 2.36, palette['basalt'], sides=12)
