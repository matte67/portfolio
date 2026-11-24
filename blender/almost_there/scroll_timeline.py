"""Export Blender's actual stop frames and projected points for the HTML card layer."""

import json

from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

from animation import marker_frame
from config import PREVIEW, STOPS


def save_timeline(scene, camera, focuses, destination):
    """Write frame and seek data without duplicating project copy from the website."""
    total_frames = scene.frame_end - scene.frame_start + 1
    fps = scene.render.fps / scene.render.fps_base

    def cue(frame):
        index = frame - scene.frame_start
        return {'frame': frame, 'timeSeconds': round(index/fps, 6), 'progress': round(index/(total_frames-1), 8)}

    stops = []
    start = scene.frame_current
    for stop, focus in zip(STOPS, focuses, strict=True):
        frame = scene.timeline_markers[stop.name].frame
        scene.frame_set(frame)
        x, y, distance = world_to_camera_view(scene, camera, Vector(focus))
        if not (0 <= x <= 1 and 0 <= y <= 1 and distance > 0):
            raise ValueError(f'The focus of {stop.name!r} is outside the camera at frame {frame}.')
        stops.append({
            'id': stop.key,
            'label': stop.name,
            **cue(frame),
            'focus': {'x': round(x, 4), 'y': round(1-y, 4)},
            'suggestedCardSide': 'left' if x > 0.5 else 'right',
            'projectKeys': list(stop.projects),
        })
    scene.frame_set(start)
    document = {
        'version': 1,
        'media': {
            'file': 'intro_preview.mp4',
            'fps': fps,
            'frameCount': total_frames,
            'durationSeconds': total_frames/fps,
            'width': scene.render.resolution_x,
            'height': scene.render.resolution_y,
        },
        'stops': stops,
        'ending': cue(marker_frame(PREVIEW.ending_second, PREVIEW)),
    }
    destination.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
