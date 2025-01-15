import classNames from 'classnames';
import { DividerTextLocation } from './enums';

type DividerProps = {
  text: string;
  textLocation?: DividerTextLocation;
};

export const Divider: React.FC<DividerProps> = ({
  text,
  textLocation = DividerTextLocation.Start,
}) => {
  const customClassName = classNames(['divider', `divider--${textLocation}`]);

  return <div className={customClassName}> {text} </div>;
};
