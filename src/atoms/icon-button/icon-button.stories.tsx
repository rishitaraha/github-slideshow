import { Meta, StoryObj } from '@storybook/react';
import { IconIdentifier } from '../../enums';
import { IconButtonVariant } from './enums';
import { IconButton } from './icon-button';

const meta: Meta<typeof IconButton> = {
  title: 'Atoms/IconButton',
  component: IconButton,
  argTypes: {
    variant: {
      options: Object.values(IconButtonVariant),
      label: Object.keys(IconButtonVariant),
      control: { type: 'select' },
    },
    iconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select', default: 'none' },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const IconButtonStory: Story = {
  args: {
    variant: IconButtonVariant.Primary,
    disabled: false,
    isLoading: false,
  },
};
