// reference :- https://github.com/react-component/slider/blob/master/docs/examples/components/TooltipSlider.tsx
// Reference Animation Frame: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
import requestAnimationFrame from 'rc-util/lib/raf';
import Tooltip from 'rc-tooltip';
import React from 'react';
import { TooltipRef } from 'rc-tooltip/lib/Tooltip';

export const HandleTooltip = (props: {
  value: number;
  children: React.ReactElement;
  visible: boolean;
  tipFormatter?: (value: number) => React.ReactNode;
}) => {
  const {
    value,
    children,
    visible,
    tipFormatter = (val) => `${val} %`,
    ...restProps
  } = props;

  const tooltipRef = React.useRef<TooltipRef>(null);
  const requestAnimationFrameRef = React.useRef<number | null>(null);

  function cancelKeepAlign() {
    requestAnimationFrame.cancel(requestAnimationFrameRef.current ?? 0);
  }

  function keepAlign() {
    requestAnimationFrameRef.current = requestAnimationFrame(() => {
      tooltipRef.current?.forceAlign();
    });
  }

  React.useEffect(() => {
    if (visible) {
      keepAlign();
    } else {
      cancelKeepAlign();
    }

    return cancelKeepAlign;
  }, [value, visible]);

  return (
    <Tooltip
      placement="top"
      overlay={tipFormatter(value)}
      overlayInnerStyle={{ minHeight: 'auto' }}
      ref={tooltipRef}
      visible={visible}
      {...restProps}
    >
      {children}
    </Tooltip>
  );
};
