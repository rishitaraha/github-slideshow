import { Meta, StoryObj } from '@storybook/react';
import { MeatBallsMenu, MeatBallsMenuDirection, MeatBallsSize } from '.';

export default {
  title: 'Molecules/MeatBallsMenu',
  component: MeatBallsMenu,
  argTypes: {
    drop: {
      options: Object.values(MeatBallsMenuDirection),
      label: Object.keys(MeatBallsMenuDirection),
      control: { type: 'select' },
    },
  },
} as Meta;

type Story = StoryObj<typeof MeatBallsMenu>;

export const MeatBallsMenuStory: Story = (args) => (
  <div className="w-100 h-100 flex-center">
    <MeatBallsMenu {...args}>
      <MeatBallsMenu.Item>Action 1</MeatBallsMenu.Item>
      <MeatBallsMenu.Item>Action 2</MeatBallsMenu.Item>
      <MeatBallsMenu.Item>Action 3</MeatBallsMenu.Item>
    </MeatBallsMenu>
  </div>
);

MeatBallsMenuStory.args = {
  drop: MeatBallsMenuDirection.Down,
  size: MeatBallsSize.Small,
};
