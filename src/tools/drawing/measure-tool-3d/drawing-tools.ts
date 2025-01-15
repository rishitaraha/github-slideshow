import { Ellipsoid, PrimitiveCollection } from 'cesium';
import { CesiumViewerType } from '../../../types';
import { MapTools } from '../../base';
import { MeasureTool3D } from './measure-tool';
import DrawingSettings from '../drawing-tool-settings';
import { MeasureToolState } from './enums';

export class MeasureTools3D extends MapTools {
  private readonly _measureTool3D: MeasureTool3D;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    const primitiveCollection = new PrimitiveCollection();

    this._viewer = options.viewer;
    options.viewer.scene.primitives.add(primitiveCollection);

    this._measureTool3D = new MeasureTool3D({
      viewer: options.viewer,
      name: 'MeasureTool',
      cursorStyle: undefined,
      pointOptions: DrawingSettings.getPointOptions(),
      polylineOptions: DrawingSettings.getPolylineOptions({
        color: DrawingSettings.color,
        ellipsoid: options.ellipsoid
          ? options.ellipsoid
          : this._viewer.scene.globe.ellipsoid,
        dashed: false,
        loop: false,
        clampToGround: false,
      }),
      primitives: primitiveCollection,
    });
  }

  activateMeasureTools3D() {
    this._measureTool3D.mode = MeasureToolState.NONE;
    this._viewer.setMapTool(this._measureTool3D);
  }
}
