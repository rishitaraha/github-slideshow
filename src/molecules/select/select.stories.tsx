import { Meta, StoryObj } from '@storybook/react';
import { Select } from './select';

export default {
  title: 'Molecules/Select',
  component: Select,
  argTypes: {},
} as Meta;

type Story = StoryObj<typeof Select>;

export const SelectStory: Story = ({ ...args }) => (
  <div style={{ width: '25.5rem', height: '2.9rem' }}>
    <Select {...args} />
  </div>
);

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
];

SelectStory.args = {
  options,
  isDisabled: true,
};
