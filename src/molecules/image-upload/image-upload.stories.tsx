import { Meta, StoryObj } from '@storybook/react';
import { ImageUpload } from './image-upload';

const meta: Meta<typeof ImageUpload> = {
  title: 'Molecules/ImageUpload',
  component: ImageUpload,
  argTypes: {},
};
export default meta;
type Story = StoryObj<typeof ImageUpload>;

export const ImageUploadStory: Story = {};
