import { Meta, StoryObj } from '@storybook/react';
import { FormMessage, FormMessageVariant } from './form-message';

const meta: Meta<typeof FormMessage> = {
  title: 'Molecules/FormMessage',
  component: FormMessage,
  argTypes: {
    variant: {
      options: Object.values(FormMessageVariant),
      label: Object.keys(FormMessageVariant),
      control: { type: 'select' },
    },
  },
};
export default meta;
type Story = StoryObj<typeof FormMessage>;

export const FormMessageStory: Story = {
  args: {
    variant: FormMessageVariant.Error,
    message: 'FormMessage',
  },
};
