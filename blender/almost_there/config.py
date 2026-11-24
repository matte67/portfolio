"""Editable geometry, shot timing and render settings for the first-person route."""

from dataclasses import dataclass


@dataclass(frozen=True)
class RoadSettings:
    # Pairs are forward depth and horizontal offset, in Blender units.
    waypoints: tuple = ((-11, -1.5), (8, 2.7), (26, -3.4), (44, 3.4),
                        (62, -3.4), (80, 3.4), (98, -3.4), (116, 3.4),
                        (134, -3.4), (152, 2.2), (176, -1.1), (220, 0.0))
    width: float = 5.1
    slab_length: float = 2.15
    bank_limit_degrees: float = 2.8
    seed: int = 701


@dataclass(frozen=True)
class CameraSettings:
    start_depth: float = -6.0
    end_depth: float = 163.2
    final_look_depth: float = 140.0
    eye_height: float = 2.15
    look_ahead: float = 7.1
    lens: float = 21.5
    bank_limit_degrees: float = 5.0
    gaze_limit_degrees: float = 30.0
    stride_easing: float = 0.27


@dataclass(frozen=True)
class Stop:
    """Placement and focus for an island revealed at one bend."""

    key: str
    name: str
    depth: float
    side: int
    clearance: float
    radius: tuple
    focus_height: float
    second: float
    projects: tuple[str, ...]


@dataclass(frozen=True)
class PreviewSettings:
    width: int = 960
    height: int = 540
    fps: int = 15
    seconds: int = 12
    samples: int = 8
    ending_second: float = 10.92

    @property
    def frame_count(self):
        return self.fps * self.seconds


ROAD = RoadSettings()
CAMERA = CameraSettings()
PREVIEW = PreviewSettings()
STOPS = (
    Stop('childhood', 'Infanzia · RE:WILD', 8, -1, 9.5, (6.1, 9.3), 1.65, 0.60, ('rewild',)),
    Stop('cinema', 'Cinema · Spazio', 26, 1, 8.7, (5.8, 5.5), 1.64, 1.83, ('spazio',)),
    Stop('camerino', 'Camerino · HackHub', 44, -1, 9.5, (6.5, 6.5), 1.85, 3.06,
         ('hackathon-management-system',)),
    Stop('unistays', 'UniStays', 62, 1, 9.0, (6.0, 5.4), 1.85, 4.30, ('unistays',)),
    Stop('arduino', 'Dormant Access Control Unit', 80, -1, 8.6, (5.5, 5.0), 1.50, 5.57,
         ('dormant-access-control-unit',)),
    Stop('nodale', 'Boccone · Spesino · Nodale', 98, 1, 9.5, (6.9, 5.6), 1.75, 6.90,
         ('boccone', 'spesino', 'nodale')),
    Stop('prenivo', 'Prenivo', 116, -1, 9.0, (6.2, 5.5), 1.75, 8.22, ('prenivo',)),
    Stop('polimi', 'Politecnico · SEF', 134, 1, 9.4, (6.3, 6.8), 1.85, 9.55, ('sef',)),
)
DENSITY = 1.0
MONUMENT_ORIGIN = (0.0, 213.0, 3.8)
SUN_ENERGY = 1.85
BACKGROUND = '#F3EFE6'
ACCENT = '#B44D32'
