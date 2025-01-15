import { defined, DeveloperError, Viewer } from 'cesium';
import { SelectTools } from '../tools/selection';

/**
 * SelectTools Mixin.
 * @param {Viewer} viewer
 * Reference https://medium.com/@coolgis/how-to-make-custom-mixin-plugin-in-cesiumjs-d546657bd381
 */
function SelectToolsMixin(viewer: Viewer) {
  if (!defined(viewer)) {
    throw new DeveloperError('viewer is required.');
  }

  const selectTools = new SelectTools(viewer);
  // @ts-ignore
  // eslint-disable-next-line no-proto
  Object.defineProperties(viewer.__proto__, {
    selectTools: {
      get: function () {
        return selectTools;
      },
      configurable: true,
    },
  });

  const oldDestroyFunction = viewer.destroy;

  viewer.destroy = function (...args) {
    oldDestroyFunction.apply(viewer, args);
    selectTools.destroy();
  };
}

export default SelectToolsMixin;
