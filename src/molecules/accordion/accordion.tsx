import classNames from 'classnames';
import React from 'react';
import BootstrapAccordion from 'react-bootstrap/Accordion';
import { Input } from '../../atoms';
import { AccordionCheckBoxStatus, AccordionVariant } from './enums';
import { AccordionComponents, AccordionProps } from './type';

export const Accordion: React.FC<AccordionProps> & AccordionComponents = ({
  children,
  className,
  dataTestId,
  variant = AccordionVariant.ChevronLeft,
  ...rest
}) => {
  const customClassName = classNames(['accordion', className, variant]);

  return (
    <BootstrapAccordion
      flush
      className={customClassName}
      data-testid={dataTestId ?? 'accordion-list-id'}
      {...rest}
    >
      {children}
    </BootstrapAccordion>
  );
};

Accordion.Item = ({ children, eventKey, title, dataTestId }) => {
  return (
    <BootstrapAccordion.Item eventKey={eventKey} data-testid={dataTestId}>
      <BootstrapAccordion.Header>{title}</BootstrapAccordion.Header>
      <BootstrapAccordion.Body>{children}</BootstrapAccordion.Body>
    </BootstrapAccordion.Item>
  );
};

Accordion.ItemWithCheckBox = ({
  children,
  eventKey,
  title,
  checkBoxStatus,
  onCheckBoxClick,
  dataTestId,
}) => {
  return (
    <BootstrapAccordion.Item eventKey={eventKey} data-testid={dataTestId}>
      <BootstrapAccordion.Header>
        <span>{title}</span>
        <Input.CheckBox
          className="accordion-header__checkbox"
          checked={checkBoxStatus === AccordionCheckBoxStatus.Checked}
          indeterminate={
            checkBoxStatus === AccordionCheckBoxStatus.Indeterminate
          }
          onClick={(event) => {
            event.stopPropagation();
            onCheckBoxClick();
          }}
        />
      </BootstrapAccordion.Header>
      <BootstrapAccordion.Body>{children}</BootstrapAccordion.Body>
    </BootstrapAccordion.Item>
  );
};
