import React, { useEffect, useState } from 'react';
import { Filter, FilterCondition, FiltersProps } from '.';
import { SelectOption } from '..';
import { Button, ButtonVariant } from '../../atoms';
import { IconIdentifier } from '../../enums';
import { FilterItem } from './filter-item';

export const FiltersContext = React.createContext<{
  mutableConditions: FilterCondition[];
  staticConditions: FilterCondition[];
}>({ mutableConditions: [], staticConditions: [] });

export const Filters: React.FC<FiltersProps> = ({
  conditions: staticConditions,
  appliedFilters: previouslyAppliedFilters,
  onFiltersChange,
}) => {
  // States
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>(
    previouslyAppliedFilters,
  );
  const [mutableConditions, setMutableConditions] = useState(() =>
    staticConditions.filter(
      (condition) =>
        !previouslyAppliedFilters
          .map((filter) => filter.condition?.value)
          .includes(condition.condition.value),
    ),
  );

  // Handlers.
  const onFilterChange = (
    condition: SelectOption | null,
    value: SelectOption | null,
    filterIndex: number,
    isRemoved?: boolean,
  ) => {
    const selectedFiltersCopy = [...selectedFilters];
    if (isRemoved) {
      selectedFiltersCopy.splice(filterIndex, 1);
      if (selectedFiltersCopy.length === 0) {
        selectedFiltersCopy.push({ condition: null, value: null });
      }
    } else {
      selectedFiltersCopy[filterIndex] = { condition, value };
    }
    setMutableConditions(() =>
      staticConditions.filter(
        (condition) =>
          !selectedFiltersCopy
            .map((filter) => filter.condition?.value)
            .includes(condition.condition.value),
      ),
    );
    setSelectedFilters(selectedFiltersCopy);
  };

  const onAddFilter = () => {
    const selectedFiltersCopy = [...selectedFilters];
    selectedFiltersCopy.push({ condition: null, value: null });
    setSelectedFilters(selectedFiltersCopy);
  };

  // useEffects.
  useEffect(() => {}, [mutableConditions]);

  return (
    <FiltersContext.Provider
      value={{
        mutableConditions: mutableConditions,
        staticConditions: staticConditions,
      }}
    >
      <div className="filters-container">
        {selectedFilters.map((selectedFilter, index) => {
          return (
            <FilterItem
              key={'filterItem ' + index}
              index={index}
              selectedCondition={selectedFilter}
              onFilterChange={onFilterChange}
              isOnly={
                selectedFilters.length === 1 &&
                !selectedFilter.condition &&
                !selectedFilter.value
              }
            />
          );
        })}
        <div className="filter__actions-container">
          <Button
            variant={ButtonVariant.Secondary}
            leftIconIdentifier={IconIdentifier.Plus}
            onClick={onAddFilter}
            className="filter__add-btn"
          >
            Add new filter
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={() => onFiltersChange(selectedFilters)}
            className="filter__apply-btn"
          >
            Apply
          </Button>
        </div>
      </div>
    </FiltersContext.Provider>
  );
};
