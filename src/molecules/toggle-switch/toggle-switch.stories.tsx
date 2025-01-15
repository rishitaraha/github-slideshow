import { Meta, StoryObj } from '@storybook/react';
import { ToggleSwitch } from './toggle-switch';

const meta: Meta<typeof ToggleSwitch> = {
  title: 'Molecules/Toggle-Switch',
  component: ToggleSwitch,
};
export default meta;

type Story = StoryObj<typeof ToggleSwitch>;

export const ToggleSwitchStory: Story = {
  args: {
    leftTitle: 'GCP',
    rightTitle: 'Checkpoint',
    leftSelected: false,
  },
};
