import { TabsProps } from 'rc-tabs';
import { Tab } from 'rc-tabs/lib/interface';

export type TabSwitcherPropArray = Omit<TabsProps, 'items' | 'onChange'> & {
  tabComponentList: Tab[];
  activeKey: string;
  onTabSwitch?: (currentTabIndex: string, tabTitle?: string) => void;
};
