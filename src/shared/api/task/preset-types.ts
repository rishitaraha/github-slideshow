export enum TaskOptionsStages {
  TASK_PRESET_NAME = 'task-preset',
  GEOTAG_INPUT_CRS = 'camera-crs',
  GCP_INPUT_CRS = 'marker-crs',
  CAMERA_CALIBRATION = 'camera-calibration',
  CAMERA_LOCATION_ACCURACY = 'camera-location-accuracy',
  ALIGN_PHOTOS = 'align-photos',
  ADD_PHOTOS = 'add_photos',
  BUILD_DENSE_CLOUD = 'build-dense-cloud',
  BUILD_MESH = 'build-mesh',
  BUILD_TEXTURE = 'build-texture',
  BUILD_ORTHOMOSAIC = 'build-orthomosaic',
  BUILD_DEM = 'build-dem',
  EXPORT_POINT_CLOUD = 'export-point-cloud',
  EXPORT_DSM = 'export-dsm',
  EXPORT_ORTHOMOSAIC = 'export-orthomosaic',
  EXPORT_REPORT = 'export-report',
  COORDINATE_SYSTEM = 'coordinate-system',
  OPTIMIZATION_OPTIONS = 'optimization-options',
  GENERATE_REPORT_WITH_CHECKPOINTS = 'generate-report-with-checkpoints',
  MARKER_PROJECTION_ACCURACY = 'marker-projection-accuracy',
  IMAGE_COORDINATES_ACCURACY = 'image-coordinates-accuracy',
}

export enum TaskOptionsValues {
  B1 = 'b1',
  B2 = 'b2',
  CX = 'cx',
  CY = 'cy',
  F = 'f',
  K1 = 'k1',
  K2 = 'k2',
  K3 = 'k3',
  K4 = 'k4',
  P1 = 'p1',
  P2 = 'p2',
  X = 'x',
  Y = 'y',
  Z = 'z',

  GENERIC_PRESELECTION = 'generic-preselection',
  REFERENCE_PRESELECTION = 'reference-preselection',
  KEYPOINT_LIMIT = 'keypoint-limit',
  TIEPOINT_LIMIT = 'tiepoint-limit',
  FILTER_MASK = 'filter-mask',
  DOWNSCALE = 'downscale',
  ACCURACY = 'accuracy',
  QUALITY = 'quality',

  ADAPTIVE_FITTING = 'adaptive-fitting',
  FILTER_STATIONARY_POINTS = 'filter-stationary-points',
  EXCLUDE_STATIONARY_TIE_POINTS = 'exclude-stationary-tie-points',
  GUIDED_MATCHING = 'guided-matching',
  GUIDED_IMAGE_MATCHING = 'guided-image-matching',

  FILTER_MODE = 'filter-mode',
  POINT_COLORS = 'point-colors',

  SURFACE_TYPE = 'surface-type',
  FACE_COUNT = 'face-count',
  INTERPOLATION = 'interpolation',
  SOURCE_DATA = 'source-data',
  VERTEX_COLORS = 'vertex-colors',

  MAPPING_MODE = 'mapping-mode',
  FILL_HOLES = 'fill-holes',

  PROJECTION_TYPE = 'projection-type',

  SURFACE_DATA = 'surface-data',
  REFINE_SEAMLINES = 'refine-seamline',
  BLENDING_MODE = 'blending-mode',

  SAVE_NORMALS = 'save-normals',
  SAVE_COLORS = 'save-colors',
  SAVE_CLASSES = 'save-classes',
  SAVE_CONFIDENCE = 'save-confidence',
  BINARY = 'binary',
  POINT_FORMAT = 'points-format',

  RASTER_TRANSFORM = 'raster-transform',
  IMAGE_FORMAT = 'image-format',
  SPLIT_IN_BLOCKS = 'split-in-blocks',
  BLOCK_WIDTH = 'block-width',
  BLOCK_HEIGHT = 'block-height',
  WHITE_BACKGROUND = 'white-background',
  SAVE_WORLD = 'save-world',
  SAVE_SCHEME = 'save-scheme',
  SAVE_ALPHA = 'save-alpha',
  TIFF_COMPRESSION = 'tiff-compression',
  JPEG_QUALITY = 'jpeg-quality',
  TIFF_BIG = 'tiff-big',
  TIFF_TILED = 'tiff-tiled',
  TIFF_OVERVIEWS = 'tiff-overviews',

  TITLE = 'title',
  DESCRIPTION = 'description',
  PAGE_NUMBERS = 'page-numbers',
  INCLUDE_SYSTEM_INFO = 'include-system-info',

  COORDINATE_SYSTEM = 'coordinate-system',
  CAMERA_CRS = 'camera-crs',
  MARKER_CRS = 'marker-crs',
  REOPTIMIZE_CAMERA = 'reoptimize-cameras',
  STOP_AFTER_REOPTIMIZE = 'stop-after-reoptimize',

  HORIZONTAL_M = 'horizontal(m)',
  VERTICAL_M = 'vertical(m)',

  MARKER_PROJECTION_ACCURACY = 'marker-projection-accuracy',

  RASTER_PIXEL_SIZE = 'raster-pixel-size',

  CROPPED_GEOTAGS_COUNT = 'cropped-geotags-count',
}

// To read options json use https://www.freeformatter.com/json-escape.html#ad-output to unescape quotes
// Then format using https://jsonformatter.curiousconcept.com/#
export type PresetValue = {
  version: string;
  [TaskOptionsStages.COORDINATE_SYSTEM]: string;
  [TaskOptionsStages.CAMERA_CALIBRATION]: {
    f: number | null;
    k1: number | null;
    k2: number | null;
    k3: number | null;
    k4: number | null;
    cx: number | null;
    cy: number | null;
    p1: number | null;
    p2: number | null;
    b1: number | null;
    b2: number | null;
  };
  [TaskOptionsStages.ALIGN_PHOTOS]: {
    [TaskOptionsValues.GENERIC_PRESELECTION]: boolean;
    [TaskOptionsValues.REFERENCE_PRESELECTION]: boolean;
    [TaskOptionsValues.KEYPOINT_LIMIT]: number;
    [TaskOptionsValues.TIEPOINT_LIMIT]: number;
    [TaskOptionsValues.FILTER_MASK]: boolean;
    [TaskOptionsValues.DOWNSCALE]: number;
    [TaskOptionsValues.ADAPTIVE_FITTING]: boolean;
  };
  [TaskOptionsStages.BUILD_DENSE_CLOUD]: {
    [TaskOptionsValues.FILTER_MODE]: string;
    [TaskOptionsValues.DOWNSCALE]: number;
    [TaskOptionsValues.POINT_COLORS]: boolean;
  };
  [TaskOptionsStages.BUILD_ORTHOMOSAIC]: {
    [TaskOptionsValues.SURFACE_DATA]: string;
    [TaskOptionsValues.FILL_HOLES]: boolean;
    [TaskOptionsValues.REFINE_SEAMLINES]: boolean;
    [TaskOptionsValues.BLENDING_MODE]: string;
    [TaskOptionsValues.PROJECTION_TYPE]: string;
    [TaskOptionsValues.COORDINATE_SYSTEM]: string;
  };
  [TaskOptionsStages.BUILD_DEM]: {
    [TaskOptionsValues.SOURCE_DATA]: string;
    [TaskOptionsValues.INTERPOLATION]: string;
    [TaskOptionsValues.PROJECTION_TYPE]: string;
    [TaskOptionsValues.COORDINATE_SYSTEM]: string;
  };
  [TaskOptionsStages.EXPORT_POINT_CLOUD]: {
    [TaskOptionsValues.SOURCE_DATA]: string;
    [TaskOptionsValues.SAVE_NORMALS]: boolean;
    [TaskOptionsValues.SAVE_COLORS]: boolean;
    [TaskOptionsValues.SAVE_CLASSES]: boolean;
    [TaskOptionsValues.SAVE_CONFIDENCE]: boolean;
    [TaskOptionsValues.BINARY]: boolean;
    [TaskOptionsValues.POINT_FORMAT]: string;
    [TaskOptionsValues.COORDINATE_SYSTEM]: string;
  };
  [TaskOptionsStages.EXPORT_DSM]: {
    [TaskOptionsValues.SOURCE_DATA]: string;
    [TaskOptionsValues.TIFF_COMPRESSION]: string;
    [TaskOptionsValues.JPEG_QUALITY]: number;
    [TaskOptionsValues.TIFF_BIG]: boolean;
    [TaskOptionsValues.TIFF_TILED]: boolean;
    [TaskOptionsValues.TIFF_OVERVIEWS]: boolean;
    [TaskOptionsValues.RASTER_TRANSFORM]: string;
    [TaskOptionsValues.IMAGE_FORMAT]: string;
    [TaskOptionsValues.SPLIT_IN_BLOCKS]: boolean;
    [TaskOptionsValues.WHITE_BACKGROUND]: boolean;
    [TaskOptionsValues.SAVE_WORLD]: boolean;
    [TaskOptionsValues.SAVE_SCHEME]: boolean;
    [TaskOptionsValues.SAVE_ALPHA]: boolean;
    [TaskOptionsValues.COORDINATE_SYSTEM]: string;
  };
  [TaskOptionsStages.EXPORT_ORTHOMOSAIC]: {
    [TaskOptionsValues.SOURCE_DATA]: string;
    [TaskOptionsValues.TIFF_COMPRESSION]: string;
    [TaskOptionsValues.JPEG_QUALITY]: number;
    [TaskOptionsValues.TIFF_BIG]: boolean;
    [TaskOptionsValues.TIFF_TILED]: boolean;
    [TaskOptionsValues.TIFF_OVERVIEWS]: boolean;
    [TaskOptionsValues.RASTER_TRANSFORM]: string;
    [TaskOptionsValues.IMAGE_FORMAT]: string;
    [TaskOptionsValues.SPLIT_IN_BLOCKS]: boolean;
    [TaskOptionsValues.WHITE_BACKGROUND]: boolean;
    [TaskOptionsValues.SAVE_WORLD]: boolean;
    [TaskOptionsValues.SAVE_SCHEME]: boolean;
    [TaskOptionsValues.SAVE_ALPHA]: boolean;
    [TaskOptionsValues.COORDINATE_SYSTEM]: string;
  };
  [TaskOptionsStages.EXPORT_REPORT]: {
    [TaskOptionsValues.TITLE]: string;
    [TaskOptionsValues.DESCRIPTION]: string;
    [TaskOptionsValues.PAGE_NUMBERS]: boolean;
    [TaskOptionsValues.INCLUDE_SYSTEM_INFO]: boolean;
  };
  [TaskOptionsStages.GEOTAG_INPUT_CRS]: string;
  [TaskOptionsStages.GCP_INPUT_CRS]: string;
  [TaskOptionsStages.OPTIMIZATION_OPTIONS]: {
    [TaskOptionsValues.REOPTIMIZE_CAMERA]: boolean;
    [TaskOptionsValues.STOP_AFTER_REOPTIMIZE]: boolean;
  };
};

export type Preset = {
  id: string;
  name: string;
  value: PresetValue;
};
