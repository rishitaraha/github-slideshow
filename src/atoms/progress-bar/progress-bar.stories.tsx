import { StoryObj, Meta } from '@storybook/react';
import { ProgressBar, ProgressBarVariant } from './progress-bar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/Progress-Bar',
  component: ProgressBar,
  argTypes: {
    variant: {
      options: Object.values(ProgressBarVariant),
      control: { type: 'select' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;
export const ProgressBarStory: Story = {
  args: {
    now: 50,
  },
};
