import React, { ComponentProps } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Box } from './box';

export default {
  title: 'Atoms/Box',
  component: Box,
} as Meta;

export const BoxStory: StoryObj<ComponentProps<typeof Box>> = (args) => {
  return <Box {...args}></Box>;
};

BoxStory.args = {
  header: 'Hello',
  text: 'World',
  link: false,
};
