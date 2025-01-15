import React from 'react';
import classNames from 'classnames';

export type CardToggleProps = {
  title: string;
  active: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  dataTestId?: string;
};

export const CardToggle: React.FC<CardToggleProps> = ({
  title,
  active,
  onClick,
  disabled,
  isLoading,
  dataTestId,
}) => {
  const customClassName = classNames([
    'card-toggle',
    { active: active && !disabled, disabled },
  ]);

  return (
    <div className={customClassName} onClick={onClick} data-testid={dataTestId}>
      {isLoading && <span className="spinner-border" />}
      {title}
    </div>
  );
};
