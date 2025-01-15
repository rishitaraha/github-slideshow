import { isNil } from 'lodash';
import { Converter } from 'shared/utils';

export const getCesiumScalePrintStyle = () => {
  const mapElement = document.querySelector('.cesium-widget canvas');
  const legendBar = document.querySelector('.distance-legend-scale-bar');

  if (!isNil(mapElement) && !isNil(legendBar)) {
    const screenWidth = Converter.pixelToNumber(
      window.getComputedStyle(mapElement).width,
    );
    const screenHeight = Converter.pixelToNumber(
      window.getComputedStyle(mapElement).height,
    );

    // Calculate print Layout's width, when print container's height is 580px (set from CSS)
    const printLayoutWidth = (screenWidth / screenHeight) * 580;
    const screenLegendWidth = Converter.pixelToNumber(
      getComputedStyle(legendBar).width ?? '',
    );

    const printLegendWidth =
      (screenLegendWidth / screenWidth) * printLayoutWidth;

    // Adding padding for 2px thus the width is {printLegendWidth + 4}
    const style = `
        @media print{
          .distance-legend, .distance-legend-label {
            width: ${printLegendWidth + 4}px;
          }

          .distance-legend-scale-bar {
            width: ${printLegendWidth}px !important;
          }
        }`;

    return style;
  }
};
