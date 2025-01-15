import { Meta, StoryObj } from '@storybook/react';
import { isEmpty, isNil } from 'lodash';
import React, { useState } from 'react';
import { SideBar, SideBarItem } from '.';
import { IconIdentifier, Placement } from '../../enums';
import { SideBarOption } from './types';
import { Tooltip } from '../../atoms';

export default {
  title: 'Organisms/Sidebar',
  component: SideBar,
} as Meta;

const options: SideBarOption[] = [
  {
    icon: {
      identifier: IconIdentifier.Plus,
      toolTipText: 'Iteration and Sites',
    },
    cardProps: {
      title: 'Iteration and Sites',
      show: false,
    },
    isHidden: false,
  },
  {
    icon: {
      identifier: IconIdentifier.Dashboard,
      toolTipText: 'Elevation Tool',
    },
    cardProps: {
      title: 'Elevation Tool',
      show: false,
    },
    isHidden: false,
  },
  {
    icon: { identifier: IconIdentifier.Map3D, toolTipText: 'Heap Management' },
    cardProps: {
      title: 'Heap Management',
      show: false,
    },
    isHidden: false,
  },
  {
    icon: { identifier: IconIdentifier.LayerFilled, toolTipText: 'Legend' },
    cardProps: {
      title: 'Legend',
      show: false,
    },
    isHidden: false,
  },
];

type Story = StoryObj<typeof SideBar>;

export const SideBarStory: React.FC<Story> = () => {
  const [activeOption, setActiveOption] = useState<SideBarOption | undefined>();

  const setActiveOptionFunc = (
    option: SideBarOption,
    identifier: IconIdentifier,
  ) => {
    // When activeOption is undefined (i.e. empty).
    if (
      isNil(activeOption) ||
      // When sidecard is already open but other option is clicked.
      (!isEmpty(activeOption) && activeOption.icon.identifier !== identifier)
    ) {
      // Updating the default selected option for current activeOption.
      setActiveOption({
        ...option,
        cardProps: {
          ...option.cardProps,
          show: true,
          onClose: () => setActiveOption(undefined),
        },
      });
    } else {
      setActiveOption(undefined);
    }
  };

  return (
    <div className="w-30">
      <SideBar>
        {options.map((option: SideBarOption, index: number) => (
          <SideBarItem key={index}>
            <Tooltip
              hoverText={option.icon.toolTipText}
              placement={Placement.Right}
            >
              <SideBarItem.Icon
                identifier={option.icon.identifier}
                isActive={
                  !isNil(activeOption) &&
                  option.icon.identifier === activeOption?.icon.identifier
                }
                onClick={() =>
                  setActiveOptionFunc(option, option.icon.identifier)
                }
                isHidden={false}
              />
            </Tooltip>
            <SideBarItem.Card
              title={activeOption ? activeOption.cardProps.title : ''}
              show={!isNil(activeOption)}
              onClose={() => setActiveOption(undefined)}
            />
          </SideBarItem>
        ))}
      </SideBar>
    </div>
  );
};
