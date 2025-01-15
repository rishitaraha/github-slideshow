import { Input } from '@aus-platform/design-system';
import classNames from 'classnames';
import { isNil, isNull } from 'lodash';
import React, { useRef } from 'react';
import { ListItemComponents, ListItemProps } from '.';

export const ListItem: ListItemProps & ListItemComponents = ({
  className,
  children,
  variant,
  onClick,
  checked = null,
  disabled = false,
}) => {
  // Refs.
  const checkBoxRef = useRef<HTMLInputElement>(null);

  // Variables.
  const customClassName = classNames([
    'list-item',
    className,
    variant,
    {
      'list-item--active': !isNil(onClick),
      'list-item--disabled': disabled,
      'list-item--checked': checked,
    },
  ]);

  // Handlers.
  const onClickListItem = (event: React.MouseEvent<HTMLDivElement>) => {
    // If checked is set, then click on checkbox.
    if (!isNull(checked)) {
      const mouseEvent = new MouseEvent('click', event.nativeEvent);
      checkBoxRef.current?.dispatchEvent(mouseEvent);
    }
    // Else click on list-item div.
    else {
      onClick?.(event);
    }
  };

  return (
    <div className="list-item-container">
      {!isNull(checked) && (
        <Input.CheckBox
          ref={checkBoxRef}
          checked={checked}
          onClick={onClick}
          name="list-item-checkbox"
        />
      )}
      <div className={customClassName} onClick={onClickListItem}>
        {children}
      </div>
    </div>
  );
};

ListItem.Action = React.forwardRef(({ children, className, ...rest }, ref) => {
  const customClassName = classNames(['list-item-action', className]);
  return (
    <div className={customClassName} ref={ref} {...rest}>
      {children}
    </div>
  );
});

ListItem.Avatar = React.forwardRef(({ children, className, ...rest }, ref) => {
  const customClassName = classNames(['list-item-avatar', className]);
  return (
    <div className={customClassName} ref={ref} {...rest}>
      {children}
    </div>
  );
});

ListItem.Content = React.forwardRef(({ className, children, ...rest }, ref) => {
  const customClassName = classNames(['list-item-content', className]);
  return (
    <div className={customClassName} ref={ref} {...rest}>
      {children}
    </div>
  );
});
