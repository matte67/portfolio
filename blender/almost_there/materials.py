"""Procedural palette, with subtle dry-brush variation on stone and paint."""

import bpy
from config import ACCENT, BACKGROUND


def linear_color(value):
    """Convert an sRGB hex token to Blender's linear RGBA."""
    channels = [int(value[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
                 for c in channels) + (1.0,)


def surface(name, color, *, grain=None, roughness=0.78, glow=0.0, alpha=1.0):
    """Build a native material, optionally with directional procedural grain."""
    material = bpy.data.materials.new(name)
    material.diffuse_color = linear_color(color)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = material.diffuse_color
    shader.inputs['Roughness'].default_value = roughness
    if grain:
        coordinates = nodes.new('ShaderNodeTexCoord')
        scale = nodes.new('ShaderNodeVectorMath')
        scale.operation = 'MULTIPLY'
        scale.inputs[1].default_value = (1.5, 0.65, 4.0)
        noise = nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 1.2
        noise.inputs['Detail'].default_value = 1.5
        ramp = nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = 0.24
        ramp.color_ramp.elements[0].color = linear_color(grain)
        ramp.color_ramp.elements[1].position = 0.72
        ramp.color_ramp.elements[1].color = material.diffuse_color
        links.new(coordinates.outputs['Object'], scale.inputs[0])
        links.new(scale.outputs[0], noise.inputs['Vector'])
        links.new(noise.outputs['Fac'], ramp.inputs[0])
        links.new(ramp.outputs[0], shader.inputs['Base Color'])
    if glow:
        shader.inputs['Emission Color'].default_value = material.diffuse_color
        shader.inputs['Emission Strength'].default_value = glow
    if alpha < 1.0:
        material.surface_render_method = 'BLENDED'
        material.use_transparency_overlap = False
        shader.inputs['Alpha'].default_value = alpha
    return material


def build_palette():
    """Create the shared materials used by the scene builders."""
    return {
        'ivory': surface('Chalk / ivory', BACKGROUND, grain='#DBCFBC'),
        'bright': surface('Porcelain', '#FFFAED'),
        'stone': surface('Warm limestone', '#B5A591', grain='#A59481'),
        'dust': surface('Pale concrete', '#CEC2B0', grain='#BEB09C'),
        'dark': surface('Soft black', '#202023', grain='#19191C'),
        'basalt': surface('Basalt', '#666068', grain='#49454B'),
        'cliff': surface('Ochre strata', '#8C6354', grain='#704E48'),
        'deep': surface('Cliff shadow', '#493D43'),
        'terracotta': surface('Oxide / terracotta', ACCENT, grain='#8A3828'),
        'rose': surface('Burnt clay', '#77392E', grain='#4F2927'),
        'grass': surface('Dried stadium turf', '#696754', grain='#4D4F40'),
        'haze': surface('Distant limestone', '#DDD0BC', grain='#C9B9A6'),
        'haze_shadow': surface('Distant stratum', '#AB8E79'),
        'gold': surface('Pale brass', '#CE9B67', roughness=0.48),
        'sage': surface('Painted sage', '#59746A', grain='#405B51'),
        'sage_pale': surface('Paper sage', '#B6C4AD'),
        'pcb': surface('Arduino blue fiberglass', '#287587', roughness=0.56),
        'metal': surface('Satin aluminum', '#AAB0AC', roughness=0.42),
        'limestone': surface('Campus limestone', '#D7C7AF', grain='#BCAB93'),
        'brick': surface('Warm historic brick', '#986B52', grain='#795039'),
        'brick_trim': surface('Aged terra-cotta trim', '#B78D6D', grain='#997458'),
        'brick_dark': surface('Deep warm brown', '#61463D'),
        'roof': surface('Weathered slate', '#49464A'),
        'glass_deep': surface('Deep blue glazing', '#203B4F', roughness=0.32),
        'glass_mid': surface('Blue steel glazing', '#4C6F83', roughness=0.31),
        'glass_light': surface('Pale blue reflection', '#82A3AE', roughness=0.36),
        'amber': surface('Low amber practical', '#F3B96E', glow=0.48),
        'lamp': surface('Warm practical light', '#FFE2AD', glow=1.7),
        'portal': surface('Light beyond the gate', '#FFEBD1', glow=1.15),
        'beam': surface('Thin stage haze', '#FFE0A9', glow=0.55, alpha=0.105),
    }
