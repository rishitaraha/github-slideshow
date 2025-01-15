import {
  ChartCustomTooltipBodyProps,
  ChartCustomTooltipHeaderProps,
  ChartCustomTooltipProps,
} from './types';

export const ChartCustomTooltip: React.FC<ChartCustomTooltipProps> = ({
  headerProps,
  bodyProps,
}) => {
  return (
    <div id="chart-tooltip" className="elc-tooltip">
      <ChartCustomTooltipHeader {...headerProps} />
      <ChartCustomTooltipBody {...bodyProps} />
    </div>
  );
};

export const ChartCustomTooltipHeader: React.FC<
  ChartCustomTooltipHeaderProps
> = ({ title, lineColor = 'transparent' }) => {
  return (
    <div className="elc-tooltip-header">
      <div
        className="elc-tooltip-header__color-block"
        style={{ backgroundColor: lineColor }}
      ></div>
      <div className="elc-tooltip-header__text">${title}</div>
    </div>
  );
};

export const ChartCustomTooltipBody: React.FC<ChartCustomTooltipBodyProps> = ({
  x,
  y,
}) => {
  return (
    <div className="elc-tooltip-body">
      <div className="elc-tooltip-body__element">
        <div className="elc-tooltip-body__key elc-tooltip-body__key--altitude">
          Altitude
        </div>
        <div className="elc-tooltip-body__value elc-tooltip-body__value--altitude">
          {x} (m)
        </div>
      </div>
      <div className="elc-tooltip-body__element">
        <div className="elc-tooltip-body__key elc-tooltip-body__key--distance">
          Distance
        </div>
        <div className="elc-tooltip-body__value elc-tooltip-body__value--distance">
          {y} (m)
        </div>
      </div>
    </div>
  );
};
