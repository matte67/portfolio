"""Localized banks of Eevee fog obscure the final slabs and the temple approach."""

import bpy

from geometry import box
from materials import linear_color


def _cloud_material(name, color, density):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    tree = material.node_tree
    tree.nodes.clear()
    coordinates = tree.nodes.new('ShaderNodeTexCoord')
    offset = tree.nodes.new('ShaderNodeVectorMath')
    offset.operation = 'SUBTRACT'
    offset.inputs[1].default_value = (0.50, 0.55, 0.45)
    tree.links.new(coordinates.outputs['Generated'], offset.inputs[0])
    radius = tree.nodes.new('ShaderNodeVectorMath')
    radius.operation = 'LENGTH'
    tree.links.new(offset.outputs['Vector'], radius.inputs[0])
    edge = tree.nodes.new('ShaderNodeMapRange')
    edge.clamp = True
    edge.interpolation_type = 'SMOOTHERSTEP'
    for key, value in (('From Min', 0.055), ('From Max', 0.495), ('To Min', density), ('To Max', 0.0)):
        edge.inputs[key].default_value = value
    tree.links.new(radius.outputs['Value'], edge.inputs['Value'])
    cloud = tree.nodes.new('ShaderNodeTexNoise')
    cloud.inputs['Scale'].default_value = 4.8
    cloud.inputs['Detail'].default_value = 1.45
    tree.links.new(coordinates.outputs['Generated'], cloud.inputs['Vector'])
    combined = tree.nodes.new('ShaderNodeMath')
    combined.operation = 'MULTIPLY'
    tree.links.new(cloud.outputs['Fac'], combined.inputs[0])
    tree.links.new(edge.outputs['Result'], combined.inputs[1])
    scatter = tree.nodes.new('ShaderNodeVolumePrincipled')
    scatter.inputs['Color'].default_value = linear_color(color)
    scatter.inputs['Anisotropy'].default_value = 0.20
    tree.links.new(combined.outputs[0], scatter.inputs['Density'])
    output = tree.nodes.new('ShaderNodeOutputMaterial')
    tree.links.new(scatter.outputs[0], output.inputs['Volume'])
    return material


def build_final_fog(group, temple_depth):
    """Place the low, dense obstruction and a higher veil across the temple base."""
    floor = _cloud_material('Nebbia / ombra tra le lastre', '#A9A1A5', 1.4)
    veil = _cloud_material('Nebbia / velo del tempio', '#CBC0B5', 0.81)
    for name, center, size, material in (
            ('Nebbia / banco basso', (0.5, -34.8, 0.65), (22.5, 37.0, 5.3), floor),
            ('Nebbia / fronte irregolare', (-3.8, -30.0, 1.7), (23.0, 35.0, 9.0), veil),
            ('Nebbia / soglia del tempio', (5.2, -7.5, 3.5), (31.0, 35.0, 14.2), veil)):
        x, y, z = center
        cloud = box(group, name, (x, temple_depth+y, z), size, material)
        cloud.display_type = 'WIRE'
