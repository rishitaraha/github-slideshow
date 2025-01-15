import { Meta, StoryObj } from '@storybook/react';
import { TableSkeleton } from './table-skeleton';

const meta: Meta<typeof TableSkeleton> = {
  title: 'Organisms/Table-Skeleton',
  component: TableSkeleton,
};
export default meta;

type Story = StoryObj<typeof TableSkeleton>;

export const TableSkeletonStory: Story = {};
