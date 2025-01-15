import { Meta, StoryObj } from '@storybook/react';
import { CopyUidPillComponent } from '.';

export default {
  title: 'Molecules/CopyUidPill',
  component: CopyUidPillComponent,
} as Meta;

export const FilterContainerStory: StoryObj<
  typeof CopyUidPillComponent
> = () => {
  return (
    <div className="w-100 h-100 flex-center">
      <CopyUidPillComponent prefixText={'ID'} serialId={10068} uidType={'T'} />
    </div>
  );
};

FilterContainerStory.args = {};
