import { IconIdentifier } from '@aus-platform/design-system';
import { MeasureType, DrawingStyle, DrawingTool } from './enums';
import { dashedDrawingStyle } from './style-constants';

export const defaultMeasureLayer = [
  {
    type: MeasureType.Area,
    viewStyleType: DrawingStyle.YellowVariant,
    tool: DrawingTool.Polygon,
    drawStyleType: dashedDrawingStyle,
    iconIdentifier: IconIdentifier.Polygon,
  },
  {
    type: MeasureType.Distance,
    viewStyleType: DrawingStyle.BlueVariant,
    tool: DrawingTool.Line,
    drawStyleType: dashedDrawingStyle,
    iconIdentifier: IconIdentifier.Line,
  },
];
