import { Meta, StoryObj } from '@storybook/react';
import { SwitchCard, SwitchCardVariant } from './switch-card';

const meta: Meta<typeof SwitchCard> = {
  title: 'Molecules/SwitchCard',
  component: SwitchCard,
  argTypes: {
    variant: {
      options: Object.values(SwitchCardVariant),
      label: Object.keys(SwitchCardVariant),
      control: { type: 'select' },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SwitchCard>;

export const SwitchCardStory: Story = {
  args: {
    title: 'Switch Card',
    checked: false,
    variant: SwitchCardVariant.Primary,
  },
};
