import { Meta, StoryObj } from '@storybook/react';
import { IconIdentifier } from '../../enums';
import { Fab } from './fab';
import { FabStack } from './fab-stack';
import { FabOrientation } from './enums';

const meta: Meta<typeof FabStack> = {
  title: 'Atoms/Floating-Action-Button/Stack',
  component: FabStack,
  argTypes: {
    orientation: {
      options: Object.values(FabOrientation),
      control: { type: 'select' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FabStack>;

export const IconButtonStory: Story = {
  args: {
    children: [...Array(3)].map((_, index) => (
      <Fab key={index} leftIconIdentifier={IconIdentifier.Ortho} />
    )),
    orientation: FabOrientation.Horizontal,
  },
};
