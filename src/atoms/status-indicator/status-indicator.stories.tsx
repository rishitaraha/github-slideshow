import { StoryObj, Meta } from '@storybook/react';
import { StatusIndicator } from './status-indicator';
import { StatusIndicatorLevel } from './enum';
import { IconIdentifier } from '../../enums';

type Story = StoryObj<typeof StatusIndicator>;

const meta: Meta<typeof StatusIndicator> = {
  title: 'Atoms/StatusIndicator',
  component: StatusIndicator,
  argTypes: {
    iconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
    status: {
      options: Object.values(StatusIndicatorLevel),
    },
  },
};
export default meta;

export const StatusIndicatorStory: Story = {
  render: () => (
    <StatusIndicator
      iconIdentifier={IconIdentifier.Contour}
      status={StatusIndicatorLevel.Done}
    />
  ),
};
