import { ColorCodes } from '@aus-platform/design-system';
import { Chart, Point } from 'chart.js';
import { isNull } from 'lodash';
import { hexToRGB } from 'src/shared/utils';

type HighlightPointPluginOptions = {
  getHighlightPoint: () => Point;
};

export const highlightPointPlugin = {
  id: 'highlightPoint',
  afterDraw: (
    chart: Chart,
    _args: Record<any, any>,
    options: HighlightPointPluginOptions,
  ) => {
    const { ctx, scales, chartArea } = chart;
    const { x: dataXValue, y: dataYValue } = options.getHighlightPoint();

    if (!isNull(dataXValue) && !isNull(dataYValue)) {
      const scaleX = scales.x;
      const scaleY = scales.y;
      const xPixel = scaleX.getPixelForValue(dataXValue);
      const yPixel = scaleY.getPixelForValue(dataYValue);

      // Draw vertical line.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPixel, chartArea.top);
      ctx.lineTo(xPixel, chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = hexToRGB(ColorCodes.Black, 0.8);
      ctx.stroke();
      ctx.closePath();

      // Draw highlight point.
      ctx.beginPath();
      ctx.arc(xPixel, yPixel, 13 / 2, 0, 2 * Math.PI, false);
      ctx.lineWidth = 6;
      ctx.fillStyle = hexToRGB(ColorCodes.Purple400, 1);
      ctx.strokeStyle = hexToRGB(ColorCodes.White, 1);
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
      ctx.restore();
    }
  },
};
