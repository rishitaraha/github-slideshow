import { Input, InputGroup } from '@aus-platform/design-system';
import * as d3 from 'd3';
import { pointer } from 'd3-selection';
import { isNil, uniqueId } from 'lodash';
import Slider from 'rc-slider';
import React, { useEffect, useRef, useState } from 'react';
import { preventNonNumber } from '../../../helpers';
import { extractHistogramXyRange } from './helpers';

type HistogramProps = {
  statistics: any;
  onChangeHistogramRescale: (rescale: string) => void;
  width?: number;
  colorMap?: any[];
  rescale?: string | null;
};

export const Histogram: React.FC<HistogramProps> = ({
  width = 318,
  colorMap = [],
  statistics,
  onChangeHistogramRescale,
  rescale,
}) => {
  // Constants.
  const defaultBandColors = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ff8000',
    '#ffff00',
    '#00ff80',
    '#00ffff',
    '#0080ff',
  ];
  // Initialize margin, width and height of histogram svg.
  const margin = { top: 5, right: 8, bottom: 15, left: 8 };
  const svgWidth = width - margin.left - margin.right;
  const svgHeight = 179 - margin.top - margin.bottom;

  // Refs.
  const histogramRef = useRef<HTMLDivElement>(null);

  // State.
  const [min, setMin] = useState(2147483647);
  const [max, setMax] = useState(-2147483646);
  const [rangeX, setRangeX] = useState<number[]>([]);
  const [rangeY, setRangeY] = useState<number[]>([]);

  // minDownState and maxDownState are required for dragging state of sliders.
  const [minDownState, setMinDownState] = useState(false);
  const [maxDownState, setMaxDownState] = useState(false);

  // UseRef.
  // minDown and maxDown useRef are required for continuous update of line sliders position.
  const minDown = useRef(false);
  const maxDown = useRef(false);
  const { current: id } = useRef(uniqueId());

  const colorMapElem =
    useRef<d3.Selection<SVGLinearGradientElement, unknown, null, undefined>>();

  useEffect(() => {
    reset();
  }, [statistics]);

  useEffect(() => {
    if (!maxDownState && !minDownState) {
      redraw();
      if (min !== 2147483647 && max !== -2147483646) {
        onChangeHistogramRescale(`${min},${max}`);
      }
    }
    updateColorMap(false);
  }, [min, max, maxDownState, minDownState, colorMap]);

  // Histogram Functions.
  const updateColorMap = (recreate) => {
    if (!colorMapElem.current) {
      return;
    }

    if (recreate) {
      colorMapElem.current.select('stop').remove();
      if (colorMap) {
        colorMap.forEach((color: number[], i) => {
          if (colorMapElem.current) {
            colorMapElem.current
              .append('stop')
              .attr('offset', `${(i / (colorMap.length - 1)) * 100.0}%`)
              .attr('stop-color', `rgb(${color.join(',')})`);
          }
        });
      }
    }

    const minPerc =
      (Math.abs(min - rangeX[0]) / (rangeX[1] - rangeX[0])) * 100.0 || 0;
    const maxPerc =
      (Math.abs(max - rangeX[0]) / (rangeX[1] - rangeX[0])) * 100.0 || 0;

    colorMapElem.current.attr('x1', `${minPerc}%`).attr('x2', `${maxPerc}%`);
  };

  // Function to initialize histogram configurations.
  const reset = () => {
    const { maxX, maxY, minX, minY } = extractHistogramXyRange(statistics);

    setRangeX([Math.floor(minX), Math.ceil(maxX)]);
    setRangeY([Math.floor(minY), Math.ceil(maxY)]);

    if (rescale) {
      const [rescaleMin, rescaleMax] = rescale.split(',');
      setMin(parseFloat(Number(rescaleMin).toFixed(3)));
      setMax(parseFloat(Number(rescaleMax).toFixed(3)));
    } else {
      setMin(parseFloat(minX.toFixed(3)));
      setMax(parseFloat(maxX.toFixed(3)));
    }
  };

  // Function to draw histogram.
  const redraw = () => {
    if (histogramRef.current) {
      if (histogramRef.current.firstElementChild) {
        histogramRef.current.removeChild(
          histogramRef.current.firstElementChild,
        );
      }

      // Create svg container.
      const svgContainer = d3
        .select(histogramRef.current)
        .append('svg')
        .attr('class', 'histogram-container') // Give class to the svg element.
        .attr('width', svgWidth + margin.left + margin.right)
        .attr('height', svgHeight + margin.top + margin.bottom);

      if (colorMap) {
        colorMapElem.current = svgContainer
          // Add defs element for color https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs.
          .append('defs')
          .append('linearGradient')
          .attr('id', `linear-${id}`)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '100%')
          .attr('y2', '0%');
        updateColorMap(true);
      }

      const svg = svgContainer
        // Add svg g element to create a group https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g.
        .append('g')
        // Add margin to group to accommodate axes.
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // Add the x-axis to svg.
      const x = d3.scaleLinear().domain(rangeX).range([0, svgWidth]);

      // Add the y-axis to svg.
      const y = d3.scaleLinear().domain(rangeY).range([svgHeight, 0]);

      for (const i in statistics) {
        const band = statistics[i];
        const data = band.histogram[0].map((e: any, i: string | number) => {
          return [band.histogram[1][i], e];
        });

        // Make sure histogram starts and ends at 0.
        // to prevent oblique looking charts.
        data.unshift([data[0][0], 0]);
        data.push([data[data.length - 1][0], 0]);

        // Plot the area
        svg
          .append('g')
          .append('path')
          .datum(data)
          .attr(
            'fill',
            !colorMapElem
              ? defaultBandColors[parseFloat(i) - 1]
              : `url(#linear-${id})`,
          )
          .attr('opacity', 1 / Object.keys(statistics).length)
          .attr(
            'd',
            d3
              .line()
              .x(function (d) {
                return x(d[0]) || 0;
              })
              .y(function (d) {
                return y(d[1]) || 0;
              }),
          );
      }

      // Add sliders
      drawAndHandleSliders(svg, svgContainer, margin, svgHeight, svgWidth);
    }
  };

  // Sliders.
  const drawAndHandleSliders = (
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    svgContainer: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    margin: Record<string, number>,
    svgHeight: number,
    svgWidth: number,
  ) => {
    let maxPosX = 0;
    let minPosX = 0;

    const minXStart =
      Math.floor(((min - rangeX[0]) / (rangeX[1] - rangeX[0])) * svgWidth) || 0;

    // Draw min slider.
    const minSlider = svg
      .append('g')
      .append('line')
      .attr('x1', minXStart)
      .attr('y1', 0)
      .attr('x2', minXStart)
      .attr('y2', svgHeight + 26)
      .attr('class', 'theme-stroke-primary slider-line min')
      .on('mousedown', function () {
        setMaxDownState(false);
        maxDown.current = false;
        setMinDownState(true);
        minDown.current = true;
      })
      .node();

    const maxXStart =
      Math.ceil(((max - rangeX[0]) / (rangeX[1] - rangeX[0])) * svgWidth) || 0;

    // Draw max slider.
    const maxSlider = svg
      .append('g')
      .append('line')
      .attr('x1', maxXStart)
      .attr('y1', 0)
      .attr('x2', maxXStart)
      .attr('y2', svgHeight + 26)
      .attr('class', 'theme-stroke-primary slider-line max')
      .on('mousedown', function () {
        setMaxDownState(true);
        maxDown.current = true;
        setMinDownState(false);
        minDown.current = false;
      })
      .node();

    const handleLeave = () => {
      setMaxDownState(false);
      maxDown.current = false;
      setMinDownState(false);
      minDown.current = false;
      maxPosX = 0;
      minPosX = 0;
    };

    const handleMoveMax = (e) => {
      if (maxDown.current || maxDownState) {
        const mouseX = pointer(e)[0];
        if (!maxPosX) {
          maxPosX = mouseX;
        }
        if (!isNil(maxSlider) && !isNil(minSlider)) {
          const minX1 = minSlider.getAttribute('x1');
          const maxX1 = maxSlider.getAttribute('x1');
          if (minX1 && maxX1) {
            const deltaX = mouseX - (maxPosX ? maxPosX : 0);
            const prevX = parseFloat(maxX1);
            const newX = Math.max(
              Math.min(svgWidth, prevX + deltaX),
              parseFloat(minX1),
            );
            maxPosX = mouseX;
            maxSlider.setAttribute('x1', newX.toString());
            maxSlider.setAttribute('x2', newX.toString());

            if (prevX !== newX) {
              setMax(
                parseFloat(
                  (
                    rangeX[0] +
                    ((rangeX[1] - rangeX[0]) / svgWidth) * newX
                  ).toFixed(3),
                ),
              );
            }
          }
        }
      }
    };

    const handleMoveMin = (e) => {
      if (minDown.current || minDownState) {
        const mouseX = pointer(e)[0];

        if (minPosX === 0) {
          minPosX = mouseX;
        }

        if (!isNil(maxSlider) && !isNil(minSlider)) {
          const minX1 = minSlider.getAttribute('x1');
          const maxX1 = maxSlider.getAttribute('x1');
          if (minX1 && maxX1) {
            const deltaX = mouseX - minPosX;
            const prevX = parseFloat(minX1);
            const newX = Math.max(
              0,
              Math.min(prevX + deltaX, parseFloat(maxX1)),
            );

            minPosX = mouseX;

            // Set slider position.
            minSlider.setAttribute('x1', newX.toString());
            minSlider.setAttribute('x2', newX.toString());

            // Update min.
            if (prevX !== newX) {
              setMin(
                parseFloat(
                  (
                    rangeX[0] +
                    ((rangeX[1] - rangeX[0]) / svgWidth) * newX
                  ).toFixed(3),
                ),
              );
            }
          }
        }
      }
    };

    svgContainer
      .on('mousemove', (e) => {
        handleMoveMax(e);
        handleMoveMin(e);
      })
      .on('mouseup', handleLeave)
      .on('mouseleave', handleLeave)
      .on('mousedown', (e: any) => {
        const mouseX = pointer(e)[0];
        if (!isNil(maxSlider) && !isNil(minSlider)) {
          const minX1 = minSlider.getAttribute('x1');
          const maxX1 = maxSlider.getAttribute('x1');

          if (!isNil(minX1) && !isNil(maxX1)) {
            const maxBarX = parseFloat(maxX1) + margin.right;
            const minBarX = parseFloat(minX1) + margin.right;

            // Move bar closest to click
            if (Math.abs(mouseX - maxBarX) < Math.abs(mouseX - minBarX)) {
              setMaxDownState(true);
              maxDown.current = true;
              maxPosX = parseFloat(maxX1) + margin.right;
              handleMoveMax(e);
            } else {
              setMinDownState(true);
              minDown.current = true;
              minPosX = parseFloat(minX1) + margin.right;
              handleMoveMin(e);
            }
          }
        }
      });
  };

  // Input Handlers.
  const handleRangeChange = (inputRange) => {
    if (inputRange[0] && inputRange[1]) {
      const newMin = inputRange[0];
      const newMax = inputRange[1];
      if (newMin !== min) {
        handleChangeMin(newMin.toString());
      } else if (newMax !== max) {
        handleChangeMax(newMax.toString());
      }
    }
  };

  const handleChangeMax = (value: string) => {
    const val = parseFloat(value);
    if (val >= min && val <= rangeX[1]) {
      setMax(val);

      // Change histogram max vertical slider position as well.
      const maxSlider = d3
        .select(histogramRef.current)
        .selectChild('svg')
        .selectChild('g')
        .selectAll('g > g > .max')
        .nodes()[0];

      if (maxSlider && maxSlider instanceof Element) {
        // Converting histogram 'x' value to Max Slider component's 'x' value.
        const maxSliderVal =
          Math.ceil(((val - rangeX[0]) / (rangeX[1] - rangeX[0])) * svgWidth) ||
          0;

        maxSlider.setAttribute('x1', maxSliderVal.toString());
        maxSlider.setAttribute('x2', maxSliderVal.toString());
      }
    }
  };

  const handleChangeMin = (value: string) => {
    const val = parseFloat(value);
    if (val <= max && val >= rangeX[0]) {
      setMin(val);

      // Change histogram min vertical slider position as well.
      const minSlider = d3
        .select(histogramRef.current)
        .selectChild('svg')
        .selectChild('g')
        .selectAll('g > g > .min')
        .nodes()[0];

      if (minSlider && minSlider instanceof Element) {
        // Converting histogram 'x' value to Min Slider component's 'x' value.
        const minSliderVal =
          Math.floor(
            ((val - rangeX[0]) / (rangeX[1] - rangeX[0])) * svgWidth,
          ) || 0;

        minSlider.setAttribute('x1', minSliderVal.toString());
        minSlider.setAttribute('x2', minSliderVal.toString());
      }
    }
  };

  return (
    <div className="histogram">
      <div className="histogram__graph">
        <div ref={histogramRef}></div>
        <Slider
          range
          min={rangeX[0]}
          max={rangeX[1]}
          value={[min, max]}
          onChange={handleRangeChange}
          step={0.01}
          onBeforeChange={() => {
            setMaxDownState(true);
            setMinDownState(true);
          }}
          onChangeComplete={() => {
            setMaxDownState(false);
            setMinDownState(false);
          }}
        />
      </div>
      <div className="histogram__input-container">
        <InputGroup>
          <Input.Label>Min</Input.Label>
          <Input.Number
            onChange={(e) => handleChangeMin(e.currentTarget.value)}
            className="form-control min-max"
            size={5}
            value={min}
            onKeyDown={preventNonNumber}
            name="min"
          />
        </InputGroup>

        <InputGroup>
          <Input.Label>Max</Input.Label>
          <Input.Number
            onChange={(e) => handleChangeMax(e.currentTarget.value)}
            className="form-control min-max"
            size={5}
            value={max}
            name="max"
            onKeyDown={preventNonNumber}
          />
        </InputGroup>
      </div>
    </div>
  );
};
