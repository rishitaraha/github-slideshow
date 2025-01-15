import { Meta, StoryObj } from '@storybook/react';
import { SideCard } from '.';
import { SideCardLocation } from '../../enums/sidecard-position';
import { Button } from '../../atoms';
import { IconIdentifier } from '../../enums';

const meta: Meta<typeof SideCard> = {
  title: 'Molecules/SideCard',
  component: SideCard,
  argTypes: {
    placement: {
      options: Object.values(SideCardLocation),
      label: Object.keys(SideCardLocation),
      control: { type: 'select' },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SideCard>;

export const SideCardStory: Story = {
  args: {
    title: 'Title',
    show: false,
    placement: SideCardLocation.End,
    backdrop: true,
    footer: <Button className="ms-auto">Submit</Button>,
    children: (
      <h4 className="bg-secondary text-white h-100 m-0 d-flex align-items-center justify-content-center">
        This is sidecard body
      </h4>
    ),
    headerChildren: (
      <Button
        rightIconIdentifier={IconIdentifier.ArrowCircleRightFill}
        className="ms-auto"
      >
        Test Button
      </Button>
    ),
    info: 'this is info',
    showBackButton: true,
    showCloseButton: true,
    onClickToggleSidecardButton: () => {},
  },
};
