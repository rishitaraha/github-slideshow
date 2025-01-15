import { defined, DeveloperError, Viewer } from 'cesium';
import { StyleFeatureTool } from '../tools';
import { CesiumViewerType } from '../types';

/**
 * StyleTools Mixin.
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function StyleToolsMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const styleTools = new StyleFeatureTool({
    viewer: viewer as CesiumViewerType,
  });
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    styleTools: {
      get: function () {
        return styleTools;
      },
      configurable: true,
    },
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    styleTools.destroy();
  };
}

export default StyleToolsMixin;
