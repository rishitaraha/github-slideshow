import type { Meta, StoryObj } from '@storybook/react';

import { InfoBox } from './info-box';

const meta: Meta<typeof InfoBox> = {
  title: 'Atoms/Info-Box',
  component: InfoBox,
};
export default meta;

type Story = StoryObj<typeof InfoBox>;

export const BoxStory: Story = {
  args: { header: 'Outputs Merged', text: 'Align and Merge', link: false },
};
