import classNames from 'classnames';
import { isEmpty, isNil } from 'lodash';
import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Icon, IconButton, Tooltip } from '../../atoms';
import {
  ColorClass,
  IconIdentifier,
  Placement,
  SideCardLocation,
} from '../../enums';
import { FormMessage } from '../form-message';
import { SideCardProps } from './types';

/**
 * TODO: Create compound component for sidecard (separate header, footer, body)
 * Add toggle button for Offcanvas Placement other than SideCardLocation.End.
 * JIRA Link: https://aarav-unmanned-systems.atlassian.net/browse/RAIN-3451?atlOrigin=eyJpIjoiYTQzODViNDAxNjU2NGYyODg4ZmRhNzQ2Y2FkZGY5MDciLCJwIjoiaiJ9
 */
export const SideCard: React.FC<SideCardProps> = ({
  show,
  title,
  children,
  onClose,
  placement = SideCardLocation.End,
  showCloseButton,
  className,
  containerClassName,
  scroll,
  footer,
  footerClassName,
  formError = '',
  enforceFocus = false,
  showBackButton,
  onBackButtonClick,
  info,
  headerChildren,
  onClickToggleSidecardButton,
  ...rest
}) => {
  // Constants.
  const customSidecardClassName = classNames(['sidecard', className]);
  const customContainerClassName = classNames(
    ['sidecard-container', placement, containerClassName],
    { show },
  );
  const customFooterClassName = classNames([
    'sidecard__footer',
    footerClassName,
  ]);

  return (
    <div className={customContainerClassName}>
      {!isNil(onClickToggleSidecardButton) && (
        <IconButton
          iconSize={24}
          iconIdentifier={
            placement === SideCardLocation.Start
              ? IconIdentifier.ChevronSmallRight
              : IconIdentifier.ChevronSmallLeft
          }
          className={`${customContainerClassName} sidecard__toggle-sidecard-button`}
          onClick={onClickToggleSidecardButton}
        />
      )}
      <Offcanvas
        show={show}
        className={customSidecardClassName}
        placement={placement}
        scroll={!!scroll}
        onHide={onClose}
        enforceFocus={enforceFocus}
        restoreFocus={false}
        {...rest}
      >
        <Offcanvas.Header className="sidecard__header">
          {showBackButton && (
            <Icon
              identifier={IconIdentifier.ChevronSmallLeft}
              onClick={onBackButtonClick}
              className="sidecard__header__icon"
              size={24}
              colorClass={ColorClass.Neutral300}
            />
          )}

          <Offcanvas.Title>
            <span>{title}</span>
            {info && (
              <Tooltip hoverText={info} placement={Placement.Bottom}>
                <Icon
                  identifier={IconIdentifier.InfoCircle}
                  size={16}
                  colorClass={ColorClass.Primary500}
                  className="sidecard__header__tooltip"
                />
              </Tooltip>
            )}
          </Offcanvas.Title>

          <div className="sidecard__header__children">{headerChildren}</div>

          {showCloseButton && (
            <Icon
              identifier={IconIdentifier.Cross}
              onClick={onClose}
              className="sidecard__header__icon ms-auto"
              size={24}
              colorClass={ColorClass.Neutral300}
            />
          )}
        </Offcanvas.Header>

        <Offcanvas.Body>{children}</Offcanvas.Body>

        {!isEmpty(formError) && <FormMessage message={formError} />}

        {footer && <div className={customFooterClassName}>{footer}</div>}
      </Offcanvas>
    </div>
  );
};
