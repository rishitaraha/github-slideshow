export enum SmartDetectOutput {
  BenchToeCrest = 'Bench Toe & Crest',
  BuildingFootprintsOrRoofTops = 'Building Footprints or Roof Tops',
  DrainageAnalysis = 'Drainage Analysis',
  HeapDetection = 'Heap Detection',
  MetalledRoads = 'Metalled Roads',
  PondsAndLakes = 'Ponds and Lakes',
  RiversAndStreams = 'Rivers and Streams',
  TreeCanopies = 'Tree Canopies',
  UnMetalledRoads = 'Un-metalled Roads',
}
export const SmartDetectOutputMapping = {
  [SmartDetectOutput.BenchToeCrest]: 'bench_toe_crest',
  [SmartDetectOutput.BuildingFootprintsOrRoofTops]:
    'building_footprints_or_roof_tops',
  [SmartDetectOutput.DrainageAnalysis]: 'drainage_analysis',
  [SmartDetectOutput.HeapDetection]: 'heap_detection',
  [SmartDetectOutput.MetalledRoads]: 'metalled_roads',
  [SmartDetectOutput.PondsAndLakes]: 'ponds_and_lakes',
  [SmartDetectOutput.RiversAndStreams]: 'rivers_and_streams',
  [SmartDetectOutput.TreeCanopies]: 'tree_canopies',
  [SmartDetectOutput.UnMetalledRoads]: 'unmetalled_roads',
};

export enum SmartDetectMarkArea {
  Draw = 'draw',
  LayerFromWorkspace = 'layer_from_workspace',
}
