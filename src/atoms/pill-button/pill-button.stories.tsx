import { StoryObj, Meta } from '@storybook/react';
import { IconPlacement, PillButton, PillButtonVariant } from './pill-button';
import { IconIdentifier } from '../../enums';
import { PillVariant } from '../pill/pill';

const meta: Meta<typeof PillButton> = {
  title: 'Atoms/PillButton',
  component: PillButton,
  argTypes: {
    variant: {
      options: Object.values(PillVariant),
      control: { type: 'select' },
    },
    iconPlacement: {
      options: Object.values(IconPlacement),
      control: { type: 'select' },
    },
    iconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
  },
};
export default meta;
type Story = StoryObj<typeof PillButton>;

export const PillButtonStory: Story = {
  args: {
    variant: PillButtonVariant.Primary,
  },
};
