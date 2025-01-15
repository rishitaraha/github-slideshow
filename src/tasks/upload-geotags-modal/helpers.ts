import { isNil } from 'lodash';
import { SelectOption } from '@aus-platform/design-system';
import {
  AccuracyFields,
  OmegaPhiKappaAccuracyFields,
  OmegaPhiKappaRotationAngleFields,
  UtmZoneAccuracyFields,
  UtmZoneFields,
  Wgs84AccuracyFields,
  Wgs84Fields,
  YawPitchRollAccuracyFields,
  YawPitchRollRotationAngleFields,
} from '../constants';
import {
  EPSGCode,
  GeotagSchemaField,
  HorizontalCRS,
  RotationAngleType,
} from 'src/shared/enums';
import {
  swapFieldsToGeographicCrs,
  swapFieldsToProjectedCrs,
  Formatter,
  swapFieldsToOPK,
  swapFieldsToYPR,
} from 'src/shared/helpers';

export const defaultGeotagSchemaColumnsListGenerator = (
  horizontalCrs: string | null,
  rotationAngles: string,
) => {
  const columnList: GeotagSchemaField[] = [GeotagSchemaField.Filename];
  if (isNil(horizontalCrs) || horizontalCrs === HorizontalCRS.WGS84) {
    columnList.push(...Wgs84Fields);
  } else {
    columnList.push(...UtmZoneFields);
  }
  if (rotationAngles === RotationAngleType.OmegaPhiKappa) {
    columnList.push(...OmegaPhiKappaRotationAngleFields);
  } else if (rotationAngles === RotationAngleType.YawPitchRoll) {
    columnList.push(...YawPitchRollRotationAngleFields);
  }
  columnList.push(...AccuracyFields);
  return columnList;
};

export const rotationAnglesLabelFormatter = (
  rotationAngle: string | null,
): string => {
  if (!rotationAngle) {
    return 'None';
  }
  return Formatter.toTitleCase(rotationAngle, '_').replaceAll(' ', '/');
};

export const geotagsSchemaFieldsToSelectOptionsMapper = (
  geotagsSchemaFieldsList: GeotagSchemaField[],
  horizontalCRS,
): SelectOption<GeotagSchemaField | null>[] => {
  if (horizontalCRS === EPSGCode.WGS84) {
    return geotagsSchemaFieldsList
      .map(swapFieldsToGeographicCrs)
      .map((field) => ({
        label: Formatter.toTitleCase(field, '_'),
        value: field,
      }));
  } else {
    return geotagsSchemaFieldsList
      .map(swapFieldsToProjectedCrs)
      .map((field) => ({
        label: Formatter.toTitleCase(field, '_'),
        value: field,
      }));
  }
};

export const geotagsSchemaColumnOptionsListHelper = ({
  allowedColumnOptionsList,
  selectedColumnOptionsList,
  selectedCrsSelectorOptions,
}): GeotagSchemaField[] => {
  const isWgs84Selected =
    selectedCrsSelectorOptions.horizontalCrs.value === HorizontalCRS.WGS84;

  const areOpkRotationAnglesSelected =
    selectedCrsSelectorOptions.rotationAngles.value ===
    RotationAngleType.OmegaPhiKappa;

  const areYprRotationAnglesSelected =
    selectedCrsSelectorOptions.rotationAngles.value ===
    RotationAngleType.YawPitchRoll;

  const columnOptionsList: GeotagSchemaField[] = [
    GeotagSchemaField.HorizontalAccuracy,
    GeotagSchemaField.VerticalAccuracy,
  ];

  if (isWgs84Selected) {
    columnOptionsList.push(...Wgs84Fields, ...Wgs84AccuracyFields);
  } else {
    columnOptionsList.push(...UtmZoneFields, ...UtmZoneAccuracyFields);
  }

  if (areOpkRotationAnglesSelected) {
    columnOptionsList.push(
      ...OmegaPhiKappaRotationAngleFields,
      ...OmegaPhiKappaAccuracyFields,
    );
  } else if (areYprRotationAnglesSelected) {
    columnOptionsList.push(
      ...YawPitchRollRotationAngleFields,
      ...YawPitchRollAccuracyFields,
    );
  }

  return columnOptionsList.reduce(
    (
      previousColumnOptionsList: GeotagSchemaField[],
      currentColumnField: GeotagSchemaField,
    ) => {
      if (
        !allowedColumnOptionsList.includes(currentColumnField) ||
        (currentColumnField !== null &&
          selectedColumnOptionsList.includes(currentColumnField))
      ) {
        return previousColumnOptionsList;
      }
      previousColumnOptionsList.push(currentColumnField);
      return previousColumnOptionsList;
    },
    [],
  );
};

export const getUpdatedColumnsListForHCrs = (
  schemaValues,
  horizontalCRS,
): GeotagSchemaField[] => {
  const currentColumnsOrder = schemaValues.columnOrder;

  if (horizontalCRS === HorizontalCRS.WGS84) {
    return currentColumnsOrder.map(swapFieldsToGeographicCrs);
  } else {
    return currentColumnsOrder.map(swapFieldsToProjectedCrs);
  }
};

export const getUpdatedColumnForRotationType = (
  schemaValues,
  rotationType,
): GeotagSchemaField[] => {
  const currentColumnsOrder = schemaValues.columnOrder;

  if (rotationType === RotationAngleType.YawPitchRoll) {
    return currentColumnsOrder.map(swapFieldsToOPK);
  } else if (rotationType === RotationAngleType.OmegaPhiKappa) {
    return currentColumnsOrder.map(swapFieldsToYPR);
  }

  return currentColumnsOrder;
};
