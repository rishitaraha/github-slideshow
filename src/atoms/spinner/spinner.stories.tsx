import { StoryObj, Meta } from '@storybook/react';
import { Spinner } from './spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
};
export default meta;

type Story = StoryObj<typeof Spinner>;
export const SpinnerStory: Story = {};
