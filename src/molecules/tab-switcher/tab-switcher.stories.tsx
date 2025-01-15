import { Meta, StoryObj } from '@storybook/react';
import { Tab } from 'rc-tabs/lib/interface';
import { useState } from 'react';
import { TabSwitcher } from '.';

export default {
  title: 'Molecules/TabSwitcher',
  component: TabSwitcher,
} as Meta;

const tabComponent: Tab[] = [
  {
    label: 'tab1',
    children: <h2> this is tab1 </h2>,
    key: 'tab1',
    disabled: false,
  },
  {
    label: 'tab2',
    children: <h2> this is tab2 </h2>,
    key: 'tab2',
    disabled: false,
  },
  {
    label: 'tab3',
    children: <h2> this is tab3 </h2>,
    key: 'tab3',
    disabled: true,
  },
];

type Story = StoryObj<typeof TabSwitcher>;
export const TabSwitcherStory: Story = () => {
  // States.
  const [activeKey, setActiveKey] = useState('tab1');

  // Handlers.
  const onTabSwitch = (tabKey: string) => {
    setActiveKey(tabKey);
  };

  return (
    <div className="w-100 h-100 flex-center-rev">
      <TabSwitcher
        defaultActiveKey={tabComponent[0].label?.toString()}
        tabComponentList={tabComponent}
        activeKey={activeKey}
        onTabSwitch={(tabIndex) => onTabSwitch(tabIndex)}
      />
    </div>
  );
};

TabSwitcherStory.args = {};
