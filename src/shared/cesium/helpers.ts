import { Cartographic, Math as CesiumMath } from 'cesium';
import { isUndefined } from 'lodash';
import { CesiumViewerType } from '@aus-platform/cesium';
import { CartographicPosition } from './types';

export const getCartographicPositionFromMousePosition = (
  mouseWindowPosition,
  viewer: CesiumViewerType | undefined,
): CartographicPosition | undefined => {
  if (!isUndefined(mouseWindowPosition) && viewer) {
    // Create a ray from the camera position through the pixel at mouseWindowPosition in world coordinates.
    const ray = viewer.scene.camera.getPickRay(mouseWindowPosition);

    if (isUndefined(ray)) {
      return;
    }

    // Find an intersection between a ray and the globe surface that was rendered. The ray must be given in world coordinates.
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (isUndefined(cartesian)) {
      return;
    }
    if (cartesian) {
      // Creates a new Cartographic instance from a Cartesian position. The values in the resulting object will be in radians.
      const cartographic = Cartographic.fromCartesian(cartesian);

      const longitude = Number(
        CesiumMath.toDegrees(cartographic.longitude).toFixed(7),
      );
      const latitude = Number(
        CesiumMath.toDegrees(cartographic.latitude).toFixed(7),
      );
      let altitude = Number(
        viewer.scene.globe.getHeight(cartographic)?.toFixed(2),
      );

      altitude = isNaN(altitude) ? 0 : altitude;

      return { longitude, latitude, altitude };
    }
  }
};
