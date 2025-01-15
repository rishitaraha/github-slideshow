import { Placement, Tooltip } from '@aus-platform/design-system';
import classNames from 'classnames';

export const OverflowTextTooltip: React.FC<{
  text: string;
  maxLength?: number;
  className?: string;
}> = ({ text, maxLength = 39, className }) => {
  // Constants.
  // -3 chars for the points.
  const containerWidthStyle = {
    maxWidth: maxLength - 3 + 'ch',
  };

  const containerClassName = classNames('overflow-text-container', className);

  // Renders.
  if (text.length >= maxLength) {
    return (
      <Tooltip hoverText={text} placement={Placement.Right}>
        <div className={containerClassName} style={containerWidthStyle}>
          {text}
        </div>
      </Tooltip>
    );
  } else {
    return (
      <div className={containerClassName} style={containerWidthStyle}>
        {text}
      </div>
    );
  }
};
