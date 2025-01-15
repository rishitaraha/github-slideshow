import { Meta, StoryObj } from '@storybook/react';
import { IconIdentifier } from '../../enums';
import { Fab } from './fab';

const meta: Meta<typeof Fab> = {
  title: 'Atoms/Floating-Action-Button',
  component: Fab,
  argTypes: {
    leftIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
    rightIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Fab>;

export const IconButtonStory: Story = {
  args: {
    disabled: false,
    active: false,
    leftIconIdentifier: IconIdentifier.Ortho,
    rightIconIdentifier: IconIdentifier.ChevronSmallRight,
    children: 'This is sample text',
  },
};
