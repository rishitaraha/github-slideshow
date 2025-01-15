import { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = { title: 'Atoms/Switch', component: Switch };
export default meta;

type Story = StoryObj<typeof Switch>;

export const SwitchStory: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};
