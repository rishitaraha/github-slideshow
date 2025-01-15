import { Meta, StoryObj } from '@storybook/react';
import { IndentedTree } from './indented-tree';
import { ColorCodes } from '../../enums';

export default {
  title: 'Molecules/IndentedTree',
  component: IndentedTree,
} as Meta;

type Story = StoryObj<typeof IndentedTree>;

const TreeElement = () => {
  return (
    <div
      style={{
        backgroundColor: ColorCodes.Neutral200,
        width: '90%',
        marginBottom: '1rem',
        padding: '1rem',
        borderRadius: '0.4rem',
      }}
    >
      This is a tree element
    </div>
  );
};

export const IndentedTreeStory: Story = (args) => {
  return (
    <IndentedTree visible={args.visible}>
      <TreeElement />
      <TreeElement />
      <TreeElement />
    </IndentedTree>
  );
};

IndentedTreeStory.args = {};
