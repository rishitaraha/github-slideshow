import React from 'react';
import { Input } from '@aus-platform/design-system';
import { FilterOption } from '../enum';
import { CheckedFilterOptionsType, FilterOptionsOverlayProps } from '../types';

export const FilterOptionsOverlay: React.FC<FilterOptionsOverlayProps> = ({
  checkedOptions,
  onCheckChange,
}) => (
  <div className="filter-options-overlay card">
    {Object.entries(FilterOption).map(([key, label]) => (
      <div key={key} className="filter-options-overlay__option-container">
        <Input.CheckBox
          checked={checkedOptions[key as keyof CheckedFilterOptionsType]}
          onChange={() => onCheckChange(key)}
        />
        <span>{label}</span>
      </div>
    ))}
  </div>
);
