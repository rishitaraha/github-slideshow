import { Meta } from '@storybook/react';
import classNames from 'classnames';
import { Accordion } from './accordion';
import { AccordionCheckBoxStatus, AccordionVariant } from './enums';

export default {
  title: 'Molecules/Accordion',
  component: Accordion,
} as Meta;

// TODO: Replace `any` with proper type.
const AccordionTemplate: any = ({ title, children, variant }) => {
  const customClassName = classNames(['accordion', variant]);

  return (
    <Accordion alwaysOpen className={customClassName} variant={variant}>
      <Accordion.Item title={title} eventKey="1">
        {children}
      </Accordion.Item>
      <Accordion.Item title="Accordion Item 2" eventKey="2">
        Accordion Body 2
      </Accordion.Item>
    </Accordion>
  );
};

export const AccordionStory = AccordionTemplate.bind({});

AccordionStory.args = {
  title: 'Accordion Title',
  children: 'Accordion Body',
  variant: AccordionVariant.ChevronLeft,
};

// Accordion with checkbox.
const AccordionWithCheckBoxTemplate: any = ({
  title,
  children,
  checkBoxStatus,
  variant,
}) => {
  const customClassName = classNames(['accordion', variant]);
  return (
    <Accordion variant={variant} className={customClassName}>
      <Accordion.ItemWithCheckBox
        title={title}
        eventKey="1"
        checkBoxStatus={checkBoxStatus}
        onCheckBoxClick={() => {}}
      >
        {children}
      </Accordion.ItemWithCheckBox>
    </Accordion>
  );
};

export const AccordionWithCheckBoxStory = AccordionWithCheckBoxTemplate.bind(
  {},
);

AccordionWithCheckBoxStory.argTypes = {
  checkBoxStatus: {
    options: Object.values(AccordionCheckBoxStatus),
    label: Object.keys(AccordionCheckBoxStatus),
    control: { type: 'select' },
  },
};

AccordionWithCheckBoxStory.args = {
  title: 'Accordion Title',
  children: 'Accordion Body',
  checkBoxStatus: AccordionCheckBoxStatus.Unchecked,
};
