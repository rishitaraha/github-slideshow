import { isEmpty, isNil } from 'lodash';
import { LayerType } from '../../shared/api';
import { FileExtension } from '../../shared/enums';
import { fileValidate } from '../../shared/helpers/file-validator';
import { validate } from '../../shared/helpers';

export type LayerValidatorType = {
  layerFile: {
    hasPermissionToUploadMbTiles: boolean;
  };
  type: {
    selectedLayerType: LayerType;
  };
};

export const layerValidatorInitialState: LayerValidatorType = {
  layerFile: {
    hasPermissionToUploadMbTiles: false,
  },
  type: {
    selectedLayerType: LayerType.MBTiles,
  },
};

export const layerInputValidator = (
  name: string,
  values: Record<string, any>,
  optional?: Record<string, boolean>,
  validatorParams?: Record<string, any>,
): string => {
  switch (name) {
    case 'sourceId': {
      if (optional?.sourceId) {
        break;
      }
      if (isEmpty(values.sourceId)) {
        return 'This field is required';
      }
      break;
    }

    case 'layerFile': {
      const selectedLayerType = values.type?.value;
      const hasPermissionToUploadMbtiles =
        validatorParams?.[name]?.hasPermissionToUploadMbTiles;

      if (optional?.mbtiles) {
        break;
      }

      if (isNil(values[name])) {
        return 'This field is required';
      }

      switch (selectedLayerType) {
        case LayerType.MBTiles:
          if (!hasPermissionToUploadMbtiles) {
            return 'You do not have permission to upload MBTiles File';
          }

          if (!fileValidate.extension(values[name], FileExtension.MBTiles)) {
            return 'Please select a .mbtiles file only.';
          }
          break;

        case LayerType.Vector:
          if (!fileValidate.extension(values[name], FileExtension.ZIP)) {
            return 'Please select a .zip file only.';
          }
          break;

        case LayerType.Orthomosaic:
        case LayerType.CapturedDsm:
          if (!fileValidate.extension(values[name], FileExtension.GeoTIFF)) {
            return 'Please select a .tiff file only.';
          }
          break;
      }
      break;
    }

    default: {
      return validate(name, values, optional);
    }
  }

  return '';
};
