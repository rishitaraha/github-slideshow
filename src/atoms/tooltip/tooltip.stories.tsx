import { StoryObj, Meta } from '@storybook/react';
import { Tooltip } from './tooltip';
import { Placement } from '../../enums';

export default {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  argTypes: {
    placement: {
      options: Object.values(Placement),
      label: Object.keys(Placement),
      control: { type: 'select' },
    },
  },
} as Meta;

type Story = StoryObj<typeof Tooltip>;

export const TooltipStory: Story = (args) => {
  return (
    <div className="w-100 d-flex justify-content-center align-items-center mt-5">
      <Tooltip {...args}>Hover me</Tooltip>
    </div>
  );
};

TooltipStory.args = {
  hoverText: 'copy?',
  placement: Placement.TopStart,
  activeState: false,
};
