import classNames from 'classnames';
import { isNil } from 'lodash';
import React, { Children, ReactElement, useMemo } from 'react';
import { Icon, IconButton, IconButtonVariant } from '../../atoms';
import { IconIdentifier } from '../../enums';
import { BreadcrumbItemProps, BreadcrumbProps } from './types';

export const Breadcrumb: React.FC<BreadcrumbProps> & {
  Item: React.FC<BreadcrumbItemProps>;
} = ({ children, className, showBackButton = true, onClickBackButton }) => {
  // Constants.
  const customClassName = classNames(['aus-breadcrumb', className]);

  // Renders.
  const renderBreadcrumbItems = useMemo(() => {
    const itemArray = Children.toArray(
      children,
    ) as ReactElement<BreadcrumbItemProps>[];

    return Children.map(itemArray, (breadcrumbItem, index) => {
      const isLast = index === itemArray.length - 1;

      if (!isLast && isNil(breadcrumbItem.props.onClick)) {
        console.warn(`BreadcrumbItem child no. ${index + 1}
            should be passed an 'onClick' prop`);
      }

      return (
        <React.Fragment key={index}>
          {index !== 0 && (
            <Icon identifier={IconIdentifier.ChevronSmallRight} size={16} />
          )}
          {breadcrumbItem}
        </React.Fragment>
      );
    });
  }, [children]);

  return (
    <div className={customClassName}>
      {showBackButton && (
        <IconButton
          className="aus-breadcrumb__back-btn"
          iconIdentifier={IconIdentifier.ArrowLeft}
          iconSize={18}
          onClick={onClickBackButton}
          variant={IconButtonVariant.Outline}
        />
      )}
      {renderBreadcrumbItems}
    </div>
  );
};

Breadcrumb.Item = ({ className, children, onClick }) => {
  const customClassName = classNames([
    'aus-breadcrumb__item',
    className,
    {
      'aus-breadcrumb__item--clickable': !isNil(onClick),
    },
  ]);

  return (
    <div className={customClassName} onClick={onClick}>
      {children}
    </div>
  );
};
