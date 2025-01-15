import type { Meta, StoryObj } from '@storybook/react';
import { CardToggle } from './card-toggle';

const meta: Meta<typeof CardToggle> = {
  title: 'Atoms/Card-Toggle',
  component: CardToggle,
};
export default meta;

type Story = StoryObj<typeof CardToggle>;

export const CardToggleStory: Story = {
  args: {
    title: 'Card Toggle',
    active: false,
    isLoading: false,
    disabled: false,
  },
};
