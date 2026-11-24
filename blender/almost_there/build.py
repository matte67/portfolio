"""Blender CLI entry point for the Almost There editable project."""

import argparse
from pathlib import Path
import sys

import bpy


PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))

from scene import build_scene
from scroll_timeline import save_timeline


def main():
    """Build the scene from factory defaults and save it at the requested path."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=PROJECT_DIR / 'output' / 'scroll-route')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version = 0
    scene = bpy.context.scene
    scene.name = 'Almost There / Percorso dei progetti'
    camera, focuses = build_scene(scene)
    bpy.context.view_layer.objects.active = camera
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                space = area.spaces.active
                space.region_3d.view_perspective = 'CAMERA'
                space.overlay.show_overlays = False
                space.shading.color_type = 'MATERIAL'
    scene.render.filepath = '//frames/intro_'
    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / 'intro_prototype.blend'))
    save_timeline(scene, camera, focuses, output_dir / 'scene_timeline.json')


if __name__ == '__main__':
    main()
