import { Meta, StoryObj } from '@storybook/react';
import { IconIdentifier } from '../../enums';
import { Button } from './button';
import { ButtonVariant } from './enums';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      options: Object.values(ButtonVariant),
      children: Object.keys(ButtonVariant),
      control: { type: 'select' },
    },
    leftIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select', default: 'none' },
    },
    rightIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const ButtonStory: Story = {
  args: {
    children: 'Label',
    rightIconIdentifier: IconIdentifier.ArrowRight,
    variant: ButtonVariant.Primary,
    disabled: false,
    isLoading: false,
  },
};
