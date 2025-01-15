import { EPSGCode, VerticalCRS } from '../enums';
import {
  CRSMapping,
  horizontalCrsSridMapping,
  WKTCrsToNameMapping,
} from '../constants';
import { TextCRSToEPSGCodeMapping } from 'src/tasks/constants';

export const getHorizontalAndVerticalCRS = (
  WKT: string,
): { horizontal: EPSGCode; vertical: VerticalCRS } => {
  const [horizontalCrsEpsg, VerticalCrs] = WKTCrsToNameMapping[WKT];
  return {
    horizontal: TextCRSToEPSGCodeMapping[horizontalCrsEpsg],
    vertical: VerticalCrs,
  };
};

export const formatToCRSMappingKey = (
  horizontalCRS: EPSGCode,
  verticalCRS: string,
) => {
  const horizontalCrsName = horizontalCrsSridMapping[horizontalCRS];
  return `${horizontalCrsName}+${verticalCRS}`;
};

export const getWktCrs = (horizontalCRS, verticalCRS) => {
  return CRSMapping[formatToCRSMappingKey(horizontalCRS, verticalCRS)];
};
