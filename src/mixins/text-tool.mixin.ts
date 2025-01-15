import { defined, DeveloperError, Viewer } from 'cesium';
import { TextTool } from '../tools';
import { CesiumViewerType } from '../types';

/**
 * TextTools Mixin.
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function TextToolMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const textTool = new TextTool({
    viewer: viewer as CesiumViewerType,
  });
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    textTool: {
      get: function () {
        return textTool;
      },
      configurable: true,
    },
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    textTool.destroy();
  };
}

export default TextToolMixin;
