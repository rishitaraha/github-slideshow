import React, { ReactNode } from 'react';
import { Modify } from '../../shared/type-utils';
import { AccordionCheckBoxStatus, AccordionVariant } from './enums';
import { AccordionProps as BootstrapAccordionProps } from 'react-bootstrap';

export type AccordionItem = {
  title: ReactNode;
  eventKey: string;
  children?: React.ReactNode;
  dataTestId?: string;
};

export type AccordionItemWithCheckBox = Modify<
  AccordionItem,
  {
    checkBoxStatus: AccordionCheckBoxStatus;
    onCheckBoxClick: () => void;
  }
> & { children?: React.ReactNode };

export type AccordionComponents = {
  Item: React.FC<AccordionItem>;
  ItemWithCheckBox: React.FC<AccordionItemWithCheckBox>;
};

export type AccordionProps = {
  variant: AccordionVariant;
  dataTestId?: string;
} & BootstrapAccordionProps;
