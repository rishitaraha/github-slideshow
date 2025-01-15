import { defined, DeveloperError, Viewer } from 'cesium';
import { FeatureInfoTool } from '../tools';

/**
 * FeatureInfo Mixin.
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function FeatureInfoToolMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const infoTool = new FeatureInfoTool({ viewer });
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    infoTool: {
      get: function () {
        return infoTool;
      },
      configurable: true,
    },
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    infoTool.destroy();
  };
}

export default FeatureInfoToolMixin;
