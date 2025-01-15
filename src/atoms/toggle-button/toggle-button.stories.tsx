import { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from './toggle-button';

const meta: Meta<typeof ToggleButton> = {
  title: 'Atoms/Toggle-Button',
  component: ToggleButton,
};
export default meta;

type Story = StoryObj<typeof ToggleButton>;

export const ToggleButtonStory: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};
