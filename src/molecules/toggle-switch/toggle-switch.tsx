import classNames from 'classnames';
import React, { useState } from 'react';

type ToggleSwitchType = {
  leftTitle: string;
  rightTitle: string;
  leftSelected: boolean;
  onChange: (itemSelected: string) => void;
  className?: string;
};

export const ToggleSwitch: React.FC<ToggleSwitchType> = ({
  leftTitle,
  rightTitle,
  leftSelected,
  onChange,
  className,
}) => {
  const [isLeftSelected, setIsLeftSelected] = useState(leftSelected);

  const handleToggle = (leftBoxSelected: boolean) => {
    if (leftBoxSelected !== isLeftSelected) {
      setIsLeftSelected(leftBoxSelected);
      if (onChange) {
        const selectedText = leftBoxSelected ? leftTitle : rightTitle;
        onChange(selectedText);
      }
    }
  };

  const leftBoxClassName = classNames([
    'toggle-switch__box',
    className,
    {
      active: isLeftSelected,
    },
    {
      disabled: !isLeftSelected,
    },
  ]);

  const rightBoxClassName = classNames([
    'toggle-switch__box',
    className,
    {
      active: !isLeftSelected,
    },
    {
      disabled: isLeftSelected,
    },
  ]);

  return (
    <div className="toggle-switch">
      <div
        className={leftBoxClassName}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle(true);
        }}
      >
        {leftTitle}
      </div>
      <div
        className={rightBoxClassName}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle(false);
        }}
      >
        {rightTitle}
      </div>
    </div>
  );
};
