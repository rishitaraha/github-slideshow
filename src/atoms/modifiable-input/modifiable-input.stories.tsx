import { Meta, StoryObj } from '@storybook/react';
import { ModifiableInput } from './modifiable-input';

const meta: Meta<typeof ModifiableInput> = {
  title: 'Atoms/Modifiable-Input',
  component: ModifiableInput,
};
export default meta;

type Story = StoryObj<typeof ModifiableInput>;

export const ModifiableInputStory: Story = {
  args: { text: 'Some project' },
};
