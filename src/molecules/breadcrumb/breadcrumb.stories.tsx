import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './breadcrumb';
import { BreadcrumbProps } from './types';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
};

type Story = StoryObj<typeof Breadcrumb>;

export const BreadcrumbTemplate: Story = (args: BreadcrumbProps) => {
  const { showBackButton } = args;

  return (
    <Breadcrumb showBackButton={showBackButton}>
      <Breadcrumb.Item onClick={() => {}}>site name so and so</Breadcrumb.Item>
      <Breadcrumb.Item>
        site name so and sosite name so and sosite name so and sosite name so
        and sosite name so and sosite name so and sosite name so and so
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        site name so and sosite name so and sosite name so and sosite name so
        and sosite name so and sosite name so and sosite name so and so
      </Breadcrumb.Item>
    </Breadcrumb>
  );
};

BreadcrumbTemplate.args = {
  showBackButton: false,
};

export default meta;
