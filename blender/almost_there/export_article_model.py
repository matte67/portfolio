"""Export a Blender prototype and its baked camera for the Almost There article.

Run Blender with the source file open:
    blender --background source.blend --python export_article_model.py -- out/model
"""

import bpy
import json
import sys
from math import atan, degrees, radians, tan
from mathutils import Quaternion
from pathlib import Path

path = Path(sys.argv[sys.argv.index('--') + 1])
scene = bpy.context.scene
y_up_rotation = Quaternion((1, 0, 0), -radians(90))
aspect = scene.render.resolution_x / scene.render.resolution_y
camera = scene.camera
fov = degrees(2 * atan(tan(camera.data.angle_x / 2) / aspect))
poses = []
for number in range(scene.frame_start, scene.frame_end + 1):
    scene.frame_set(number)
    pos, rot, _ = camera.matrix_world.decompose()
    pos = y_up_rotation @ pos
    rot = y_up_rotation @ rot
    poses.append([round(v, 5) for v in (*pos, rot.x, rot.y, rot.z, rot.w)])
scene.frame_set(scene.frame_start)
path.with_suffix(".json").write_text(json.dumps({"fov": fov, "poses": poses}, separators=(",", ":")))

# glTF preserves image textures but cannot carry Blender's procedural color ramps.
# Use the source palette for these surfaces and leave actual image textures intact.
for material in bpy.data.materials:
    if not material.use_nodes or not material.node_tree:
        continue
    for shader in material.node_tree.nodes:
        if shader.type != 'BSDF_PRINCIPLED':
            continue
        color = shader.inputs['Base Color']
        for link in tuple(color.links):
            if link.from_node.type == 'VALTORGB':
                material.node_tree.links.remove(link)
                color.default_value = material.diffuse_color

bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.view_layer.objects:
    if obj.type in {'MESH', 'FONT', 'CURVE', 'EMPTY'} and not any(
        slot.material and slot.material.node_tree and any(node.type == 'PRINCIPLED_VOLUME' for node in slot.material.node_tree.nodes)
        for slot in obj.material_slots
    ):
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(path.with_suffix('.glb')), export_format='GLB',
    use_selection=True, export_animations=False, export_cameras=False, export_lights=False,
    export_apply=True)
