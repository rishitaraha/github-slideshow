// reference :- https://github.com/react-component/slider/blob/master/docs/examples/components/TooltipSlider.tsx
import * as React from 'react';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';
import type { SliderProps } from 'rc-slider';
import { HandleTooltip } from './handle-tooltip';
import { SliderComponentProps } from './types';

export const SliderComponent: React.FC<SliderComponentProps> = ({
  min,
  max,
  tipFormatter,
  tipProps,
  dataTestId,
  ...rest
}) => {
  const tipHandleRender: SliderProps['handleRender'] = (node, handleProps) => {
    return (
      <HandleTooltip
        value={handleProps.value}
        visible={handleProps.dragging}
        tipFormatter={tipFormatter}
        {...tipProps}
      >
        {node}
      </HandleTooltip>
    );
  };

  return (
    <Slider
      className="aus-slider"
      min={min ? min : 0}
      max={max ? max : 100}
      defaultValue={0}
      handleRender={tipHandleRender}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
