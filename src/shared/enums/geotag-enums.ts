export enum GeotagSchemaField {
  None = 'none',
  Filename = 'filename',
  Latitude = 'latitude',
  Longitude = 'longitude',
  Northing = 'northing',
  Easting = 'easting',
  Altitude = 'altitude',
  Omega = 'omega',
  Phi = 'phi',
  Kappa = 'kappa',
  HorizontalAccuracy = 'horizontal_accuracy',
  VerticalAccuracy = 'vertical_accuracy',
  LatitudeAccuracy = 'latitude_accuracy',
  LongitudeAccuracy = 'longitude_accuracy',
  NorthingAccuracy = 'northing_accuracy',
  EastingAccuracy = 'easting_accuracy',
  OmegaAccuracy = 'omega_accuracy',
  PhiAccuracy = 'phi_accuracy',
  KappaAccuracy = 'kappa_accuracy',
  Yaw = 'yaw',
  Pitch = 'pitch',
  Roll = 'roll',
  YawAccuracy = 'yaw_accuracy',
  PitchAccuracy = 'pitch_accuracy',
  RollAccuracy = 'roll_accuracy',
}

export enum CoordinatesName {
  Latitude = 'Latitude',
  Longitude = 'Longitude',
  Easting = 'Easting',
  Northing = 'Northing',
  Altitude = 'Altitude',
}

export enum RotationAngleType {
  OmegaPhiKappa = 'omega_phi_kappa',
  YawPitchRoll = 'yaw_pitch_roll',
}

export enum GCPImageTagType {
  ApproxTag = 'approx_tag',
  Tagged = 'tagged',
  Untagged = 'untagged',
}
