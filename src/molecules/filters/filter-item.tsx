import { isNull, isUndefined } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { FilterItemProps, FiltersContext } from '.';
import { Select, SelectOption } from '..';
import { IconIdentifier } from '../../enums';
import { Icon } from '../../atoms';

export const FilterItem: React.FC<FilterItemProps> = ({
  index,
  selectedCondition: appliedCondition,
  onFilterChange,
  isOnly,
}) => {
  // States.
  const [selectedValue, setSelectedValue] = useState<SelectOption | null>(
    appliedCondition.value,
  );
  const [selectedCondition, setSelectedCondition] =
    useState<SelectOption | null>(appliedCondition.condition);
  const [valuesOptions, setValuesOptions] = useState<SelectOption[]>();

  // Hooks.
  const { mutableConditions, staticConditions } = useContext(FiltersContext);

  useEffect(() => {
    setSelectedCondition(appliedCondition.condition);
    setSelectedValue(appliedCondition.value);
    const condition = staticConditions.find(
      (item) => item.condition.value === appliedCondition.condition?.value,
    );
    setValuesOptions(condition?.values);
  }, [appliedCondition]);

  // Handlers.
  const onConditionChange = (option: SelectOption | any) => {
    setSelectedValue(null);
    setSelectedCondition(option);
    const condition = staticConditions.find(
      (item) => item.condition.value === option.value,
    );
    if (!isUndefined(condition)) {
      setValuesOptions(condition.values);
    }
  };

  const onValueChange = (option: SelectOption | any) => {
    setSelectedValue(option);
    if (!isNull(selectedCondition)) {
      onFilterChange(selectedCondition, option, index);
    }
  };

  const conditionOptions = mutableConditions.map((item) => item.condition);

  return (
    <div className="filter">
      <span className="w-10">{index === 0 ? 'Where' : 'And'}</span>{' '}
      <Select
        options={conditionOptions}
        value={selectedCondition}
        onChange={onConditionChange}
        placeholder={`Condition ${index + 1}`}
      />
      is{' '}
      <Select
        options={valuesOptions}
        value={selectedValue}
        onChange={onValueChange}
        placeholder={`Value ${index + 1}`}
      />
      <div className="filter__remove-icon">
        {!isOnly && (
          <Icon
            className="filter__remove-icon"
            identifier={IconIdentifier.XCircle}
            onClick={() => onFilterChange(null, null, index, true)}
          />
        )}
      </div>
    </div>
  );
};
