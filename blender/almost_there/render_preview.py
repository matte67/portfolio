"""Render Eevee stills or a complete H.264 preview from an open Blender scene."""

import argparse
from pathlib import Path
from shutil import copyfile, which
import subprocess
import sys
from tempfile import TemporaryDirectory

import bpy


PROJECT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_DIR))

from config import OUTPUT_REVISION

DEFAULT_OUTPUT = PROJECT_DIR / 'output' / OUTPUT_REVISION


def _stills(scene):
    return {
        'start_frame.png': scene.frame_start,
        'middle_frame.png': (scene.frame_start + scene.frame_end) // 2,
        'end_frame.png': scene.frame_end,
    }


def _render_stills(scene, output_dir):
    for name, frame in _stills(scene).items():
        scene.frame_set(frame)
        scene.render.filepath = str(output_dir / name)
        bpy.ops.render.render(write_still=True)


def _encode(ffmpeg, scene, frame_dir, destination):
    frames_per_second = scene.render.fps / scene.render.fps_base
    # Frequent independent frames cap decode work. Each scroll stop is also a direct seek target.
    keyframe_interval = max(1, int(frames_per_second / 2))
    stop_indices = sorted({marker.frame - scene.frame_start for marker in scene.timeline_markers
                           if scene.frame_start < marker.frame <= scene.frame_end})
    # Frame indices avoid rounding fractional PTS up to the next frame.
    keyframe_expression = '+'.join(f'eq(n,{index})' for index in stop_indices)
    force_keyframes = ['-force_key_frames', f'expr:{keyframe_expression}'] if stop_indices else []
    subprocess.run([
        ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
        '-framerate', str(frames_per_second), '-start_number', str(scene.frame_start),
        '-i', str(frame_dir / 'intro_%04d.png'), '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '18', '-pix_fmt', 'yuv420p', '-g', str(keyframe_interval), '-keyint_min', '1',
        '-sc_threshold', '0', *force_keyframes, '-movflags', '+faststart', str(destination),
    ], check=True)


def _render_sequence(scene, frame_dir):
    frame_dir.mkdir()
    scene.render.filepath = str(frame_dir / 'intro_')
    bpy.ops.render.render(animation=True)


def _render_preview(scene, staging, output_dir):
    frames = staging / 'frames'
    _render_sequence(scene, frames)
    for name, frame in _stills(scene).items():
        copyfile(frames / f'intro_{frame:04d}.png', staging / name)
    ffmpeg = which('ffmpeg')
    if ffmpeg is None:
        frames.rename(output_dir / staging.name.replace('.preview-', 'frames-', 1))
        print('FFmpeg is unavailable. Saved the numbered PNG sequence alongside the stills.')
        return
    destination = staging / 'intro_preview.mp4'
    _encode(ffmpeg, scene, frames, destination)
    destination.replace(output_dir / destination.name)


def main():
    """Render the loaded project using its saved resolution and timing."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--stills-only', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'PNG'
    scene.render.use_file_extension = True
    with TemporaryDirectory(prefix='.preview-', dir=output_dir) as temporary:
        staging = Path(temporary)
        if args.stills_only:
            _render_stills(scene, staging)
        else:
            _render_preview(scene, staging, output_dir)
        for name in _stills(scene):
            (staging / name).replace(output_dir / name)


if __name__ == '__main__':
    main()
