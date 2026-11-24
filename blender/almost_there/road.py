"""Define the road centerline and generate individual editable concrete slabs."""

from bisect import bisect_right
from math import atan, hypot, radians, tan
from random import Random

from geometry import curve, island, mesh


class RoadPath:
    """Cubic Hermite interpolation of lateral offset over forward depth."""

    def __init__(self, settings):
        self.waypoints = settings.waypoints
        self.bank_limit = radians(settings.bank_limit_degrees)
        self.depths = tuple(point[0] for point in self.waypoints)
        slopes = [(b[1] - a[1]) / (b[0] - a[0])
                  for a, b in zip(self.waypoints, self.waypoints[1:])]
        self.slopes = (slopes[0], *((a + b) / 2 for a, b in zip(slopes, slopes[1:])),
                       slopes[-1])

    def offset(self, depth):
        """Return the horizontal center at any forward depth."""
        index = max(0, min(bisect_right(self.depths, depth) - 1, len(self.depths) - 2))
        y0, x0 = self.waypoints[index]
        y1, x1 = self.waypoints[index + 1]
        interval = y1 - y0
        t = (depth - y0) / interval
        return ((2*t**3 - 3*t**2 + 1) * x0 + (t**3 - 2*t**2 + t) * interval * self.slopes[index]
                + (-2*t**3 + 3*t**2) * x1 + (t**3 - t**2) * interval * self.slopes[index + 1])

    def _slope(self, depth):
        return (self.offset(depth + 0.05) - self.offset(depth - 0.05)) / 0.1

    def turn(self, depth):
        """Measure the signed change of tangent over a short stretch of road."""
        return atan(self._slope(depth + 2.8)) - atan(self._slope(depth - 2.8))

    def point(self, depth, lateral=0.0, height=0.0):
        """Project a banked cross-section coordinate into world space."""
        slope = self._slope(depth)
        length = hypot(1, slope)
        bank = self.bank_limit * max(-1.0, min(1.0, self.turn(depth) / 0.32)) if lateral else 0.0
        return (self.offset(depth) + lateral / length, depth - lateral * slope / length,
                height - lateral*tan(bank))


def _slab(group, path, name, depth, length, left, right, top, material, edge, rng):
    cuts = [rng.uniform(0.08, 0.23) for _ in range(4)]
    profile = [(left + cuts[0], 0), (right - cuts[1], 0.12), (right, length * 0.29),
               (right - 0.06, length * 0.78), (right - cuts[2], length),
               (left + cuts[3], length - 0.06), (left, length * 0.71), (left - 0.02, 0.32)]
    center = path.point(depth + length / 2, (left + right) / 2, top)
    upper = [path.point(depth + ahead, side, top + rng.uniform(-0.035, 0.035))
             for side, ahead in profile]
    lower = [path.point(depth + ahead + 0.08, side * 0.95, top - rng.uniform(0.32, 0.52))
             for side, ahead in profile]
    vertices = [tuple(value - origin for value, origin in zip(point, center))
                for point in upper + lower]
    count = len(profile)
    faces = [tuple(range(count)), tuple(reversed(range(count, 2 * count)))]
    faces += [((i + 1) % count, i, i + count, (i + 1) % count + count) for i in range(count)]
    item = mesh(group, name, vertices, faces, (material, edge), (0, *([1] * (count + 1))))
    item.location = center


def build_road(group, path, settings, palette):
    """Create broken cross-sections, oxide inlays, and a non-rendering guide."""
    rng = Random(settings.seed)
    guide = curve(group, 'Road centerline guide', [path.point(y, height=0.18)
                  for y in range(round(path.depths[0]), round(path.depths[-1]) + 1)])
    guide.hide_render = True
    guide.hide_set(True)
    road_fragments = (palette['dust'], palette['cliff'], palette['basalt'], palette['deep'])
    for index in range(round((path.depths[-1] - path.depths[0]) / settings.slab_length)):
        depth = path.depths[0] + index * settings.slab_length
        width = settings.width * (1 - max(0, depth) / 470) + rng.uniform(-0.38, 0.32)
        height = rng.uniform(-0.10, 0.10)
        length = settings.slab_length - rng.uniform(0.11, 0.27)
        if index % 11 in (5, 6):
            length *= 0.79
            height -= 0.18
        if index % 6 in (0, 3):
            split = rng.uniform(-1.0, 1.0)
            spans = ((-width / 2, split), (split + 0.10, width / 2))
        else:
            spans = ((-width / 2, width / 2),)
        colors = ('dust', 'dust', 'stone') if depth < 135 else ('haze', 'dust', 'stone')
        for part, (left, right) in enumerate(spans):
            _slab(group, path, f'Slab {index + 1:02}.{part + 1}', depth, length,
                  left, right, height - part * 0.085, palette[rng.choice(colors)],
                  palette['haze_shadow' if depth > 135 else 'basalt'], rng)
        if index % 4 in (1, 2) and 1 < index < 74:
            side = 1 if (index // 4) % 3 else -1
            left = side * width * 0.36
            points = [path.point(depth + ahead, left + across, height + 0.065)
                      for across, ahead in ((0, 0.33), (0.20, 0.33), (0.20, 1.31), (0, 1.31))]
            mesh(group, f'Oxide road inlay {index:02}', points, ((0, 1, 2, 3),),
                 (palette['terracotta'],))
        if index % 4 == 0 and index < 34:
            lateral = rng.choice((-1, 1)) * width * 0.68
            island(group, f'Detached road fragment {index:02}',
                   path.point(depth + 1.15, lateral, rng.uniform(-1.8, -0.62)),
                   (rng.uniform(0.4, 1.1), rng.uniform(0.5, 1.3)), 0.75,
                   road_fragments, settings.seed + index, sides=6)
