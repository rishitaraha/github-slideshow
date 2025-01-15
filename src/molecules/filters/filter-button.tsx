import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import { Button, ButtonVariant } from '../../atoms/button/';
import { IconIdentifier } from '../../enums';
import { Placement } from '../../enums/placement';
import { Filters, FiltersProps } from '../../molecules/filters';
import { OverlayPopover } from '../../molecules/overlay';

type FilterButtonProps = FiltersProps & {
  className?: string;
};

export const FilterButton: React.FC<FilterButtonProps> = ({
  conditions,
  appliedFilters,
  onFiltersChange,
  className,
}) => {
  const [show, setShow] = useState(false);
  const target = useRef<HTMLButtonElement>(null);

  return (
    <div className={classNames(['filter-btn__container', className])}>
      <Button
        ref={target}
        onClick={() => setShow(!show)}
        variant={ButtonVariant.Secondary}
        leftIconIdentifier={IconIdentifier.Funnel}
      >
        Filter
      </Button>
      <OverlayPopover
        target={target.current}
        show={show}
        placement={Placement.BottomStart}
        body={
          <Filters
            conditions={conditions}
            appliedFilters={appliedFilters}
            onFiltersChange={(selectedFilters) => {
              setShow(false);
              onFiltersChange(selectedFilters);
            }}
          />
        }
      />
    </div>
  );
};
