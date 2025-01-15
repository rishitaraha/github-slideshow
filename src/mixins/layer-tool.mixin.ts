import { defined, DeveloperError, Viewer } from 'cesium';
import { CesiumLayerTool } from '../tools/layers/cesium-layer-tool';
import { CesiumViewerType } from '../types';

/**
 * LayerTools Mixin.
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function CesiumLayerToolMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const layerTool = new CesiumLayerTool(<CesiumViewerType>viewer);
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    layerTool: {
      get: function () {
        return layerTool;
      },
      configurable: true,
    },
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    layerTool.destroy();
  };
}

export default CesiumLayerToolMixin;
