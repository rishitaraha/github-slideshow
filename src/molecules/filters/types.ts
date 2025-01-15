import { SelectOption } from '..';

export type FiltersProps = {
  conditions: FilterCondition[];
  appliedFilters: Filter[];
  onFiltersChange: (selectedFilters: Filter[]) => void;
};

export type FilterItemProps = {
  index: number;
  selectedCondition: Filter;
  onFilterChange: (
    condition: SelectOption | null,
    value: SelectOption | null,
    filterIndex: number,
    isRemoved?: boolean,
  ) => void;
  isOnly?: boolean;
};
export type FilterCondition = {
  condition: SelectOption;
  values: SelectOption[];
};

export type Filter = {
  condition: SelectOption | null;
  value: SelectOption | null;
};
