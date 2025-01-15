import type { Meta, StoryObj } from '@storybook/react';
import { Icon as AUSIcon } from './icon';
import { IconIdentifier } from '../../enums/icon-identifiers';
const meta: Meta<typeof AUSIcon> = {
  title: 'Atoms/Icon',
  component: AUSIcon,
  argTypes: {
    identifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AUSIcon>;

export const IconStory: Story = {
  args: { identifier: IconIdentifier.Plus, size: 24 },
};
