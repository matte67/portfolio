"""First-person camera following the road with independent gaze and banking."""

from math import atan2, cos, exp, radians, sin

from mathutils import Quaternion, Vector
import bpy


LOOK_LEAD = 8.6
LOOK_WINDOW = 4.05
FOCUS_BLEND = 0.77
FOCUS_TURN_LIMIT = 0.31


def marker_frame(seconds, preview):
    """Map a shot cue to the nearest Blender frame in the baked camera path."""
    return round(seconds * (preview.frame_count - 1) / preview.seconds) + 1


def _timing(settings, duration, stops):
    keys = [(0, settings.start_depth),
            *((stop.second, stop.depth - LOOK_LEAD) for stop in stops),
            (duration, settings.end_depth)]
    slopes = [(b[1] - a[1]) / (b[0] - a[0]) for a, b in zip(keys, keys[1:])]
    carry = 1.0 - settings.stride_easing
    speeds = (slopes[0] * carry,
              *(min(a, b)*carry for a, b in zip(slopes, slopes[1:])), slopes[-1]*0.41)
    return keys, speeds


def _depth_at(second, timing):
    keys, speeds = timing
    for index, ((start, depth), (end, next_depth)) in enumerate(zip(keys, keys[1:])):
        if second <= end:
            interval = end - start
            t = (second - start) / interval
            return (depth + (next_depth - depth)*t*t*(3-2*t)
                    + interval*t*(1-t)*(speeds[index]*(1-t) - speeds[index+1]*t))
    return keys[-1][1]


def _clamp(value, limit):
    return max(-limit, min(limit, value))


def _smoothstep(value):
    t = max(0.0, min(1.0, value))
    return t*t*(3-2*t)


def _pose(path, settings, seconds, timing, stops, focuses, destination):
    depth = _depth_at(seconds, timing)
    position = Vector(path.point(depth, height=settings.eye_height))
    lead = Vector(path.point(depth + settings.look_ahead, height=0.77))
    heading = (lead - position).normalized()
    for stop, focus in zip(stops, focuses):
        distance = depth - (stop.depth - LOOK_LEAD)
        weight = FOCUS_BLEND * exp(-0.5*(distance / LOOK_WINDOW)**2)
        # Keep the glance forward as the subject moves beside the camera.
        sightline = Vector(focus) - position
        weight *= _smoothstep(sightline.y / 5.5)
        heading += (sightline.normalized() - heading) * weight
    # Lift the gaze toward the temple while the camera remains at eye level.
    final_span = settings.end_depth - settings.final_look_depth - 4.0
    final_weight = 0.87*_smoothstep((depth - settings.final_look_depth) / final_span)
    heading = heading.lerp((Vector(destination) - position).normalized(), final_weight)
    course = atan2(lead.x - position.x, lead.y - position.y)
    gaze = atan2(heading.x, heading.y)
    yaw = course + _clamp(gaze - course, radians(settings.gaze_limit_degrees))
    rotation = Vector((sin(yaw), cos(yaw), max(-0.22, heading.z))).to_track_quat('-Z', 'Y')
    turn = path.turn(depth + 1.1)
    bank = _clamp(turn / FOCUS_TURN_LIMIT, 1.0) * radians(settings.bank_limit_degrees)
    return position, rotation @ Quaternion((0, 0, 1), -bank)


def build_camera(scene, group, path, settings, preview, stops, focuses, destination):
    """Bake the continuous shot and annotate every island in the Timeline."""
    data = bpy.data.cameras.new('Obiettivo / prima persona')
    data.lens = settings.lens
    data.clip_start = 0.12
    data.clip_end = 320
    camera = bpy.data.objects.new('Camera / prima persona', data)
    group.objects.link(camera)
    scene.camera = camera
    camera.rotation_mode = 'QUATERNION'
    timing = _timing(settings, preview.seconds, stops)
    for index in range(preview.frame_count):
        seconds = index * preview.seconds / (preview.frame_count - 1)
        camera.location, rotation = _pose(path, settings, seconds, timing, stops, focuses, destination)
        if index and camera.rotation_quaternion.dot(rotation) < 0:
            rotation.negate()
        camera.rotation_quaternion = rotation
        camera.keyframe_insert(data_path='location', frame=index+1, group='Percorso')
        camera.keyframe_insert(data_path='rotation_quaternion', frame=index+1, group='Sguardo e inclinazione')
    for stop in stops:
        scene.timeline_markers.new(stop.name, frame=marker_frame(stop.second, preview))
    scene.timeline_markers.new('La strada si perde nella nebbia',
                               frame=marker_frame(preview.ending_second, preview))
    scene.frame_set(1)
    return camera
