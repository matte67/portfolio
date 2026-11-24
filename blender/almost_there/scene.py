"""Compose the autobiographical route and its final fog bank in Eevee."""

from math import radians
from random import Random

import bpy
from mathutils import Vector

from animation import build_camera
from atmosphere import build_final_fog
from catalogue_assets import (build_hackhub_detail, build_nodale, build_prenivo,
                              build_rewild_detail, build_sef_detail, build_spazio_detail)
from cinema import build_cinema
from config import (BACKGROUND, CAMERA, DENSITY, MONUMENT_ORIGIN, PREVIEW, ROAD,
                    STOPS, SUN_ENERGY)
from geometry import collection, island
from materials import build_palette, linear_color
from memories import build_camerino, build_childhood, build_polimi
from monument import build_monument
from projects import build_arduino, build_unistays
from road import RoadPath, build_road


BUILDERS = {
    'childhood': (build_childhood, build_rewild_detail),
    'cinema': (build_cinema, build_spazio_detail),
    'camerino': (build_camerino, build_hackhub_detail),
    'unistays': (build_unistays,),
    'arduino': (build_arduino,),
    'nodale': (build_nodale,),
    'prenivo': (build_prenivo,),
    'polimi': (build_polimi, build_sef_detail),
}


def _place(group, name, origin, angle):
    pivot = bpy.data.objects.new(f'{name} / posizione', None)
    group.objects.link(pivot)
    for item in group.all_objects:
        if item != pivot and item.parent is None:
            item.parent = pivot
    pivot.location = origin
    pivot.rotation_euler.z = angle


def _islands(root, path, palette):
    focuses = []
    for index, stop in enumerate(STOPS, 1):
        group = collection(f'{index:02}  {stop.name}', root)
        top = 'dust' if index % 2 else 'stone'
        layers = tuple(palette[key] for key in (top, 'cliff', 'basalt', 'deep'))
        island(group, f'{stop.name} / isola', (0, 0, -0.12), stop.radius,
               5.25 + (index % 3)*0.66, layers, 825+index*11, sides=15)
        for builder in BUILDERS[stop.key]:
            builder(group, palette)
        # The display faces the road and the direction from which the camera approaches.
        x = path.offset(stop.depth) + stop.side*stop.clearance
        _place(group, stop.name, (x, stop.depth+1.32, 0.28), radians(-stop.side*30.0))
        focuses.append((x - stop.side*0.2, stop.depth+0.60, stop.focus_height))
    return tuple(focuses)


def _ground(group, path, palette):
    rng = Random(919)
    near = tuple(palette[k] for k in ('stone', 'basalt', 'cliff', 'deep'))
    far = tuple(palette[k] for k in ('haze', 'haze_shadow', 'stone', 'deep'))
    for index in range(round(27*DENSITY)):
        depth = rng.uniform(-2, 176)
        side = rng.choice((-1, 1))
        x = path.offset(depth) + side*rng.uniform(5.7, 22.9)
        radius = rng.uniform(0.44, 2.3)
        island(group, f'Frammento di roccia {index+1:02}', (x, depth, rng.uniform(-4.8, -1.4)),
               (radius, radius*rng.uniform(0.61, 1.23)), radius*1.18,
               far if depth > 122 else near, 1275+index, sides=7)


def _lighting(scene, group):
    world = bpy.data.worlds.new('Orizzonte avorio')
    world.use_nodes = True
    background = world.node_tree.nodes.get('Background')
    background.inputs['Color'].default_value = linear_color(BACKGROUND)
    background.inputs['Strength'].default_value = 1.0
    scene.world = world
    for name, direction, energy, color, shadows in (
            ('Sole caldo', (4, 7, -9), SUN_ENERGY, (1.0, 0.91, 0.80), True),
            ('Riempimento', (-5, 2, -3), 0.36, (0.78, 0.85, 1.0), False),
            ('Controluce', (-3, -6, -7), 0.63, (1.0, 0.83, 0.70), False)):
        data = bpy.data.lights.new(name, 'SUN')
        data.energy = energy
        data.color = color
        data.angle = radians(8)
        data.use_shadow = shadows
        lamp = bpy.data.objects.new(name, data)
        group.objects.link(lamp)
        lamp.rotation_euler = Vector(direction).to_track_quat('-Z', 'Y').to_euler()


def _preview_settings(scene):
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = PREVIEW.samples
    scene.eevee.use_raytracing = False
    scene.eevee.volumetric_tile_size = '8'
    scene.eevee.volumetric_samples = 40
    scene.render.resolution_x = PREVIEW.width
    scene.render.resolution_y = PREVIEW.height
    scene.render.resolution_percentage = 100
    scene.render.fps = PREVIEW.fps
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.compression = 15
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.frame_start = 1
    scene.frame_end = PREVIEW.frame_count


def build_scene(scene):
    """Populate the route and return the camera and focus points for export."""
    _preview_settings(scene)
    root = scene.collection
    palette = build_palette()
    path = RoadPath(ROAD)
    focuses = _islands(collection('Isole e ricordi', root), path, palette)
    _ground(collection('Frammenti sospesi', root), path, palette)
    build_road(collection('Strada e guida', root), path, ROAD, palette)
    landmark = collection('Tempio', root)
    build_monument(landmark, palette)
    _place(landmark, 'Tempio', MONUMENT_ORIGIN, 0)
    build_final_fog(collection('Nebbia finale', root), MONUMENT_ORIGIN[1])
    _lighting(scene, collection('Illuminazione', root))
    x, y, z = MONUMENT_ORIGIN
    camera = build_camera(scene, collection('Camera', root), path, CAMERA, PREVIEW,
                          STOPS, focuses, (x, y, z+6.5))
    return camera, focuses
