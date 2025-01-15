import classNames from 'classnames';
import { FC } from 'react';
import { RadioToggle } from '../radio-toggle';
import { RadioToggleGroupProps } from './types';

export const RadioToggleGroup: FC<RadioToggleGroupProps> = ({
  radioOptions,
  onChange,
  disabled = () => false,
  checked,
  className,
  hideRadioOptions = [],
  ...rest
}) => {
  const customClassName = classNames(['radio-toggle-group']);

  return (
    <div className={customClassName}>
      {radioOptions.map(
        (option, index) =>
          !hideRadioOptions.includes(option.value) && (
            <RadioToggle
              key={'radio-toggle-group' + index}
              label={option.label}
              checked={checked(option)}
              disabled={disabled(option)}
              onChange={(event) => onChange(event)}
              title={option.value}
              className={className}
              {...rest}
            />
          ),
      )}
    </div>
  );
};
