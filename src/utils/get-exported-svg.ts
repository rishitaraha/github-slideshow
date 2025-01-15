import { defined } from 'cesium';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { HALIGN, LabelSVGType, VALIGN } from './types';

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 */

export const DEFAULT_LABEL_SVG_TYPE_VALUE = {
  id: 'default-svg-id',
  text: 'Default Label Text',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: DrawingSettings.defaultFontFamily,
  textColor: '#000000',
  backgroundColor: '#ffcc33',
  strokeColor: '#333333',
  strokeWidth: 1,
  borderRadius: 6,
  horizontalAlign: HALIGN.CENTER,
  verticalAlign: VALIGN.MIDDLE,
  paddingHorizontal: 4,
  paddingVertical: 4,
  opacity: 1,
  scale: 1,
};

function getTextWidth(text: string, font: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  context.font = font;
  const metrics = context.measureText(text);
  canvas.remove();
  return metrics.width;
}

function getCanvasFont(
  fontWeight: number,
  fontSize: number,
  fontFamily: string,
) {
  return `${fontWeight} ${fontSize}px ${fontFamily}`;
}

function exportSVG(svg: string): string {
  let b64 = 'data:image/svg+xml;base64,';

  // https://developer.mozilla.org/en/DOM/window.btoa
  b64 += window.btoa(svg);

  return b64;
}

/**
 * Generate svg path for rounded rect.
 * @param {Number} x top left x coordinate of rectangle
 * @param {Number} y top left y coordinate of rectangle
 * @param {Number} width width of rectangle
 * @param {Number} height height of rectangle
 * @param {Number} radius border radius of rectangle
 * @returns {String} svg path
 */
function createRoundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  return (
    // Move to position, offset by radius in x direction.
    'M' +
    (x + radius) +
    ',' +
    y +
    // Draw a horizontal line to the top right curve start.
    'h' +
    (width - 2 * radius) +
    // Draw the top right corner curve.
    'a' +
    radius +
    ',' +
    radius +
    ' 0 0 1 ' +
    radius +
    ',' +
    radius +
    // Draw a vertical line to the bottom right corner.
    'v' +
    (height - 2 * radius) +
    // Draw the bottom right corner curve.
    'a' +
    radius +
    ',' +
    radius +
    ' 0 0 1 ' +
    -radius +
    ',' +
    radius +
    // Draw a horizontal line to the bottom left corner.
    'h' +
    (2 * radius - width) +
    // Draw the bottom left corner.
    'a' +
    -radius +
    ',' +
    -radius +
    ' 0 0 1 ' +
    -radius +
    ',' +
    -radius +
    // Draw a vertical line to the top left corner.
    'v' +
    (2 * radius - height) +
    // Draw the top left corner.
    'a' +
    radius +
    ',' +
    -radius +
    ' 0 0 1 ' +
    radius +
    ',' +
    -radius +
    // Close the shape.
    'z'
  );
}

export function getLabelSVG(options?: LabelSVGType): string {
  let labelOptions = DEFAULT_LABEL_SVG_TYPE_VALUE;
  if (options) {
    labelOptions = { ...DEFAULT_LABEL_SVG_TYPE_VALUE, ...options };
  } else {
    labelOptions = DEFAULT_LABEL_SVG_TYPE_VALUE;
  }

  const labelFont = getCanvasFont(
    labelOptions.fontWeight,
    labelOptions.fontSize,
    labelOptions.fontFamily,
  );

  let labelWidth = getTextWidth(labelOptions.text, labelFont);

  if (!labelWidth) {
    labelWidth = 200;
  }

  const svgTemplate = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${
    (labelWidth +
      labelOptions.paddingHorizontal +
      2 * labelOptions.borderRadius) *
    labelOptions.scale
  }" height="${
    (2 * labelOptions.paddingVertical +
      labelOptions.fontSize +
      2 * labelOptions.borderRadius) *
    labelOptions.scale
  }">
    <g transform="scale(${labelOptions.scale})">
      <path d="${createRoundedRectPath(
        labelOptions.borderRadius / 2,
        labelOptions.borderRadius / 2,
        labelWidth + labelOptions.paddingHorizontal + labelOptions.borderRadius,
        2 * labelOptions.paddingVertical +
          labelOptions.fontSize +
          labelOptions.borderRadius,
        labelOptions.borderRadius,
      )}" fill="${labelOptions.backgroundColor}" stroke="${
    labelOptions.strokeColor
  }" stroke-width="${labelOptions.strokeWidth}" opacity="${
    labelOptions.opacity
  }" />
      <text x="50%" y="50%" font-family="${
        labelOptions.fontFamily
      }" font-size="${labelOptions.fontSize}" fill="${
    labelOptions.textColor
  }" dominant-baseline="middle" text-anchor="middle" opacity="${
    labelOptions.opacity
  }">${labelOptions.text}</text>
    </g>
  </svg>
  `;

  return exportSVG(svgTemplate);
}

export function getCheckMarkSVG({ size = 24, fillColor = '#FF00FF' }): string {
  const checkMarkSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 17l-5-5.299 1.399-1.43 3.574 3.736 6.572-7.007 1.455 1.403-8 8.597z" fill="${fillColor}"/>
      <path d="M12 17l-5-5.299 1.399-1.43 3.574 3.736 6.572-7.007 1.455 1.403-8 8.597z" fill="#FFFFFF"/>
    </svg>
  `;
  return exportSVG(checkMarkSVG);
}

// fillColor and strokeColor should be color code or empty string
export function getPointMarkerSVG(
  fillColor = '#F9CC34',
  strokeColor?: string,
  strokeWidth?: number,
): string {
  const pointMarkerSVG = `
  <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_1110_17992)">
      <path d="M12 12C13.1 12 14 11.1 14 10C14 8.9 13.1 8 12 8C10.9 8 10 8.9 10 10C10 11.1 10.9 12 12 12ZM12 2C16.2 2 20 5.22 20 10.2C20 13.38 17.55 17.12 12.66 21.43C12.28 21.76 11.71 21.76 11.33 21.43C6.45 17.12 4 13.38 4 10.2C4 5.22 7.8 2 12 2Z" fill="${fillColor}"/>
      ${
        defined(strokeColor) && defined(strokeWidth)
          ? `<path d="M12 12.8C13.5418 12.8 14.8 11.5418 14.8 10C14.8 8.45817 13.5418 7.2 12 7.2C10.4582 7.2 9.2 8.45817 9.2 10C9.2 11.5418 10.4582 12.8 12 12.8ZM12 2.8C15.7831 2.8 19.2 5.68631 19.2 10.2C19.2 11.5831 18.6662 13.1613 17.4942 14.9534C16.3239 16.743 14.546 18.701 12.1341 20.8272C12.0554 20.8942 11.9348 20.8943 11.8561 20.8273C9.44929 18.7012 7.67392 16.7433 6.50474 14.9537C5.33387 13.1615 4.8 11.5831 4.8 10.2C4.8 5.68631 8.21694 2.8 12 2.8Z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`
          : ''
      }
    </g>
    <defs>
    <filter id="filter0_d_1110_17992" x="0" y="0" width="24" height="27.6777" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="2"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1110_17992"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1110_17992" result="shape"/>
    </filter>
    </defs>
  </svg>
  `;
  return exportSVG(pointMarkerSVG);
}

export function getPointClusterLabelSVG(numberOfPoints: string): string {
  const pointLabel = 'points';

  const labelFont = getCanvasFont(500, 12, DrawingSettings.defaultFontFamily);
  const pointLabelWidth = getTextWidth(numberOfPoints, labelFont) || 200;
  const clusterLabelWidth = getTextWidth(pointLabel, labelFont) || 200;

  const labelWidth = Math.max(pointLabelWidth, clusterLabelWidth);
  const labelOptions = DEFAULT_LABEL_SVG_TYPE_VALUE;

  const svgTemplate = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${
    (labelWidth +
      labelOptions.paddingHorizontal +
      2 * labelOptions.borderRadius) *
    labelOptions.scale
  }" height="${
    (2 * (labelOptions.paddingVertical + labelOptions.fontSize) +
      2 * labelOptions.borderRadius) *
    labelOptions.scale
  }">
    <g transform="scale(${labelOptions.scale})">
      <path d="${createRoundedRectPath(
        labelOptions.borderRadius / 2,
        labelOptions.borderRadius / 2,
        labelWidth + labelOptions.paddingHorizontal + labelOptions.borderRadius,
        2 * labelOptions.paddingVertical +
          labelOptions.fontSize +
          labelOptions.borderRadius,
        labelOptions.borderRadius,
      )}" fill="${labelOptions.backgroundColor}" stroke="${
    labelOptions.strokeColor
  }" stroke-width="${labelOptions.strokeWidth}" opacity="${
    labelOptions.opacity
  }" />
      <text x="50%" y="25%" font-family="${
        labelOptions.fontFamily
      }" font-size="${labelOptions.fontSize}" fill="${
    labelOptions.textColor
  }" dominant-baseline="middle" text-anchor="middle" opacity="${
    labelOptions.opacity
  }">${numberOfPoints}</text>
  <text x="50%" y="50%" font-family="${labelOptions.fontFamily}" font-size="${
    labelOptions.fontSize
  }" fill="${
    labelOptions.textColor
  }" dominant-baseline="middle" text-anchor="middle" opacity="${
    labelOptions.opacity
  }">${pointLabel}</text>
    </g>
  </svg>
  `;

  return exportSVG(svgTemplate);
}
