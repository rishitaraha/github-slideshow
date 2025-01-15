import { IconIdentifier } from '@aus-platform/design-system';
import { GCPTypeLabel, GCPType } from './enums';
import { GeotagSchemaField, ProcessingStatus } from 'src/shared/enums';
import { EPSGCode, HorizontalCRS, VerticalCRS } from 'src/shared/enums/crs';

export const InputHorizontalCRSOptions = [
  {
    label: 'WGS_84',
    value: EPSGCode.WGS84,
  },
  {
    label: 'WGS_84/UTM ZONE 42',
    value: EPSGCode.WGS84_UTM_ZONE_42,
  },
  {
    label: 'WGS_84/UTM ZONE 43',
    value: EPSGCode.WGS84_UTM_ZONE_43,
  },
  {
    label: 'WGS_84/UTM ZONE 44',
    value: EPSGCode.WGS84_UTM_ZONE_44,
  },
  {
    label: 'WGS_84/UTM ZONE 45',
    value: EPSGCode.WGS84_UTM_ZONE_45,
  },
  {
    label: 'WGS_84/UTM ZONE 46',
    value: EPSGCode.WGS84_UTM_ZONE_46,
  },
];

export const InputVerticalCRSOptions = [
  {
    label: 'ELLIPSOIDAL',
    value: VerticalCRS.ELLIPSOIDAL,
  },
  {
    label: 'EGM96',
    value: VerticalCRS.EGM96,
  },
  {
    label: 'EGM2008',
    value: VerticalCRS.EGM2008,
  },
  {
    label: 'AHD71',
    value: VerticalCRS.AHD71,
  },
];

export const OutputHorizontalCRSOptions = [
  {
    label: 'WGS_84',
    value: EPSGCode.WGS84,
  },
  {
    label: 'WGS_84/UTM ZONE 42',
    value: EPSGCode.WGS84_UTM_ZONE_42,
  },
  {
    label: 'WGS_84/UTM ZONE 43',
    value: EPSGCode.WGS84_UTM_ZONE_43,
  },
  {
    label: 'WGS_84/UTM ZONE 44',
    value: EPSGCode.WGS84_UTM_ZONE_44,
  },
  {
    label: 'WGS_84/UTM ZONE 45',
    value: EPSGCode.WGS84_UTM_ZONE_45,
  },
  {
    label: 'WGS_84/UTM ZONE 46',
    value: EPSGCode.WGS84_UTM_ZONE_46,
  },
];

export const OutputVerticalCRSOptions = [
  {
    label: 'ELLIPSOIDAL',
    value: VerticalCRS.ELLIPSOIDAL,
  },
  {
    label: 'EGM96',
    value: VerticalCRS.EGM96,
  },
  {
    label: 'EGM2008',
    value: VerticalCRS.EGM2008,
  },
  {
    label: 'AHD71',
    value: VerticalCRS.AHD71,
  },
];

export const AccuracyFields: GeotagSchemaField[] = [
  GeotagSchemaField.HorizontalAccuracy,
  GeotagSchemaField.VerticalAccuracy,
];

export const OmegaPhiKappaRotationAngleFields: GeotagSchemaField[] = [
  GeotagSchemaField.Omega,
  GeotagSchemaField.Phi,
  GeotagSchemaField.Kappa,
];

export const OmegaPhiKappaAccuracyFields: GeotagSchemaField[] = [
  GeotagSchemaField.OmegaAccuracy,
  GeotagSchemaField.PhiAccuracy,
  GeotagSchemaField.KappaAccuracy,
];

export const YawPitchRollRotationAngleFields: GeotagSchemaField[] = [
  GeotagSchemaField.Yaw,
  GeotagSchemaField.Pitch,
  GeotagSchemaField.Roll,
];

export const YawPitchRollAccuracyFields: GeotagSchemaField[] = [
  GeotagSchemaField.YawAccuracy,
  GeotagSchemaField.PitchAccuracy,
  GeotagSchemaField.RollAccuracy,
];

export const Wgs84Fields: GeotagSchemaField[] = [
  GeotagSchemaField.Latitude,
  GeotagSchemaField.Longitude,
  GeotagSchemaField.Altitude,
];

export const Wgs84AccuracyFields: GeotagSchemaField[] = [
  GeotagSchemaField.LatitudeAccuracy,
  GeotagSchemaField.LongitudeAccuracy,
];

export const UtmZoneFields: GeotagSchemaField[] = [
  GeotagSchemaField.Northing,
  GeotagSchemaField.Easting,
  GeotagSchemaField.Altitude,
];

export const UtmZoneAccuracyFields: GeotagSchemaField[] = [
  GeotagSchemaField.NorthingAccuracy,
  GeotagSchemaField.EastingAccuracy,
];

export const EpsgCodeToTextCRSMapping = {
  [EPSGCode.WGS84]: HorizontalCRS.WGS84,
  [EPSGCode.WGS84_UTM_ZONE_42]: HorizontalCRS.WGS84_UTM_ZONE_42,
  [EPSGCode.WGS84_UTM_ZONE_43]: HorizontalCRS.WGS84_UTM_ZONE_43,
  [EPSGCode.WGS84_UTM_ZONE_44]: HorizontalCRS.WGS84_UTM_ZONE_44,
  [EPSGCode.WGS84_UTM_ZONE_45]: HorizontalCRS.WGS84_UTM_ZONE_45,
  [EPSGCode.WGS84_UTM_ZONE_46]: HorizontalCRS.WGS84_UTM_ZONE_46,
  [EPSGCode.GDA2020_MGA_ZONE_50]: HorizontalCRS.GDA2020_MGA_ZONE_50,
};

export const TextCRSToEPSGCodeMapping = {
  [HorizontalCRS.WGS84]: EPSGCode.WGS84,
  [HorizontalCRS.WGS84_UTM_ZONE_42]: EPSGCode.WGS84_UTM_ZONE_42,
  [HorizontalCRS.WGS84_UTM_ZONE_43]: EPSGCode.WGS84_UTM_ZONE_43,
  [HorizontalCRS.WGS84_UTM_ZONE_44]: EPSGCode.WGS84_UTM_ZONE_44,
  [HorizontalCRS.WGS84_UTM_ZONE_45]: EPSGCode.WGS84_UTM_ZONE_45,
  [HorizontalCRS.WGS84_UTM_ZONE_46]: EPSGCode.WGS84_UTM_ZONE_46,
  [HorizontalCRS.GDA2020_MGA_ZONE_50]: EPSGCode.GDA2020_MGA_ZONE_50,
};

export const GcpTypeToLabel = {
  [GCPType.CONTROLPOINT]: GCPTypeLabel.GCP,
  [GCPType.CHECKPOINT]: GCPTypeLabel.CHECKPOINT,
};

export const GcpLabelToType = {
  ['GCP']: GCPType.CONTROLPOINT,
  ['Checkpoint']: GCPType.CHECKPOINT,
};

export const noDataViewText = {
  Images: {
    heading: "You've not uploaded any Images yet",
    subHeading: 'Do you want to upload?',
    btnIcon: IconIdentifier.Upload,
    btnText: 'Upload Images',
  },
  Geotags: {
    heading: "You've not uploaded any Geotags yet",
    subHeading: 'Do you want to upload?',
    btnIcon: IconIdentifier.Upload,
    btnText: 'Upload Geotags',
  },
  Tasks: {
    heading: "You've not added any Tasks yet",
    subHeading: 'Do you want to add one?',
    btnIcon: IconIdentifier.Plus,
    btnText: 'Create Task',
  },
};

export enum ExifOrientationNumber {
  One = 1,
  Three = 3,
  Six = 6,
  Eight = 8,
}

enum ImageOrientationTypeSlug {
  HorizontalNormal = 'horizontal_normal',
  RotatedBy180 = 'rotated_180',
  RotatedCWBy90 = 'rotated_90_cw',
  RotatedCCWBy90 = 'rotated_90_ccw',
}

export const ExifOrientationNumberToTypeMapping = {
  [ImageOrientationTypeSlug.HorizontalNormal]: ExifOrientationNumber.One,
  [ImageOrientationTypeSlug.RotatedBy180]: ExifOrientationNumber.Three,
  [ImageOrientationTypeSlug.RotatedCWBy90]: ExifOrientationNumber.Six,
  [ImageOrientationTypeSlug.RotatedCCWBy90]: ExifOrientationNumber.Eight,
};

export const FinalStateTaskStatus: Array<string> = [
  ProcessingStatus.Error,
  ProcessingStatus.Cancelled,
  ProcessingStatus.Completed,
];
