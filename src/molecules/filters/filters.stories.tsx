import { Meta, StoryObj } from '@storybook/react';
import { Filters } from '.';
import { FilterButton } from './filter-button';

export default {
  title: 'Molecules/Filters',
  component: Filters,
} as Meta;

const filterConditions = [
  {
    condition: { label: 'State', value: 'state' },
    values: [{ label: 'Some State', value: 'value' }],
  },
  {
    condition: { label: 'Site', value: 'site' },
    values: [{ label: 'Some Site', value: 'value' }],
  },
  {
    condition: { label: 'GDC', value: 'gdc' },
    values: [{ label: 'Some GDC', value: 'value' }],
  },
  {
    condition: { label: 'Taluka', value: 'taluka' },
    values: [{ label: 'Some Taluka', value: 'value' }],
  },
  {
    condition: { label: 'Village Name', value: 'village' },
    values: [{ label: 'Some Village', value: 'value' }],
  },
];

type Story = StoryObj<typeof Filters>;

export const FilterContainerStory: Story = () => {
  return (
    <div className="w-100 h-100">
      <FilterButton
        conditions={filterConditions}
        onFiltersChange={() => {}}
        appliedFilters={[]}
      />
    </div>
  );
};

FilterContainerStory.args = {};
