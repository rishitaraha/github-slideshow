import classNames from 'classnames';
import React from 'react';
import {
  Accordion as BootstrapAccordion,
  AccordionProps as BootstrapAccordionProps,
} from 'react-bootstrap';
import { TaskAccordionCollapse } from './task-accordion-collapse';
import { TaskAccordionHeader } from './task-accordion-header';
import { TaskAccordionItem } from './task-accordion-item';
import { TaskAccordionComponents } from './types';

export const TaskAccordion: React.FC<BootstrapAccordionProps> &
  TaskAccordionComponents = ({ children, className, ...rest }) => {
  const customClassName = classNames(['task-accordion', className]);

  return (
    <BootstrapAccordion
      className={customClassName}
      prefix="task-accordion"
      {...rest}
    >
      {children}
    </BootstrapAccordion>
  );
};

TaskAccordion.Collapse = TaskAccordionCollapse;

TaskAccordion.Header = TaskAccordionHeader;

TaskAccordion.Item = TaskAccordionItem;
