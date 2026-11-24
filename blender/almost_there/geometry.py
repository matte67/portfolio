"""Mesh primitives and faceted platforms shared by the scene builders."""

from math import cos, pi, sin
from random import Random

import bpy
from mathutils import Vector


def collection(name, parent):
    """Create an editable Outliner collection inside the supplied parent."""
    item = bpy.data.collections.new(name)
    parent.children.link(item)
    return item


def place_collection(group, name, origin, *, angle=0.0, scale=1.0):
    """Keep a group editable under one pivot without flattening its existing hierarchy."""
    pivot = bpy.data.objects.new(name, None)
    group.objects.link(pivot)
    for item in group.all_objects:
        if item != pivot and item.parent is None:
            item.parent = pivot
    pivot.location = origin
    pivot.rotation_euler.z = angle
    pivot.scale = (scale,) * 3
    return pivot


def mesh(group, name, vertices, faces, materials, indices=()):
    """Link a mesh with optional per-face material assignments."""
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    item = bpy.data.objects.new(name, data)
    group.objects.link(item)
    for material in materials:
        data.materials.append(material)
    for face, index in zip(data.polygons, indices):
        face.material_index = index
    return item


def box(group, name, center, dimensions, material, angle=0.0):
    """Create a box with baked dimensions and an independent local pivot."""
    x, y, z = (dimension / 2 for dimension in dimensions)
    vertices = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
                (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    item = mesh(group, name, vertices, faces, (material,))
    item.location = center
    item.rotation_euler.z = angle
    return item


def tube(group, name, start, end, radius, material, *, sides=8, tip=None):
    """Build a low-sided cylinder or frustum between two local points."""
    axis = Vector(end) - Vector(start)
    half = axis.length / 2
    upper_radius = radius if tip is None else tip
    vertices = [(r * cos(2 * pi * i / sides), r * sin(2 * pi * i / sides), z)
                for z, r in ((-half, radius), (half, upper_radius)) for i in range(sides)]
    faces = [tuple(reversed(range(sides))), tuple(range(sides, 2 * sides))]
    faces += [(i, (i + 1) % sides, (i + 1) % sides + sides, i + sides)
              for i in range(sides)]
    item = mesh(group, name, vertices, faces, (material,))
    item.location = (Vector(start) + Vector(end)) / 2
    item.rotation_euler = axis.to_track_quat('Z', 'Y').to_euler()
    return item


def label(group, name, body, center, size, material):
    """Place editable lettering on a surface that faces the arriving camera."""
    data = bpy.data.curves.new(name, 'FONT')
    data.body = body
    data.align_x = 'CENTER'
    data.align_y = 'CENTER'
    data.size = size
    data.extrude = 0.006
    data.materials.append(material)
    item = bpy.data.objects.new(name, data)
    group.objects.link(item)
    item.location = center
    item.rotation_euler.x = pi / 2
    return item


def island(group, name, center, radii, depth, materials, seed, *, sides=12):
    """Generate a triangulated shelf with irregular, tapered geological strata."""
    rng = Random(seed)
    ring = [(cos(a) * rng.uniform(0.83, 1.12), sin(a) * rng.uniform(0.83, 1.12))
            for a in (2 * pi * i / sides for i in range(sides))]
    vertices = [(0, 0, 0)]
    for scale, height in ((1, 0), (0.9, -0.25), (0.66, -0.67), (0.29, -1)):
        vertices.extend((x * radii[0] * scale * rng.uniform(0.85, 1.12),
                         y * radii[1] * scale * rng.uniform(0.85, 1.12),
                         depth * height + rng.uniform(-0.17, 0.1)) for x, y in ring)
    faces = [(0, 1 + i, 1 + (i + 1) % sides) for i in range(sides)]
    indices = [0] * sides
    for level in range(3):
        offset = 1 + level * sides
        for i in range(sides):
            a, b = offset + i, offset + (i + 1) % sides
            faces.extend(((b, a, a + sides), (b, a + sides, b + sides)))
            indices.extend((1 + (level + rng.randrange(2)) % 3,
                            1 + (level + rng.randrange(3)) % 3))
    faces.append(tuple(reversed(range(3 * sides + 1, 4 * sides + 1))))
    indices.append(3)
    item = mesh(group, name, vertices, faces, materials, indices)
    item.location = center
    return item


def curve(group, name, points, material=None, *, thickness=0, closed=False):
    """Link an editable poly spline with optional circular bevel."""
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth = thickness
    data.bevel_resolution = 0
    data.resolution_u = 4
    spline = data.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for control, coordinate in zip(spline.points, points):
        control.co = (*coordinate, 1)
    spline.use_cyclic_u = closed
    if material:
        data.materials.append(material)
    item = bpy.data.objects.new(name, data)
    group.objects.link(item)
    return item
