import React from 'react';
import 'rc-tabs/assets/index.css';
import Tabs from 'rc-tabs';
import { TabSwitcherPropArray } from './types';
import classNames from 'classnames';
import { isString } from 'lodash';

export const TabSwitcher: React.FC<TabSwitcherPropArray> = ({
  className,
  tabComponentList,
  activeKey,
  onTabSwitch = () => {},
  defaultActiveKey = isString(tabComponentList[0].label)
    ? tabComponentList[0].label
    : '',
  ...rest
}) => {
  const customClassName = classNames('tab-switcher', className);

  return (
    <Tabs
      className={customClassName}
      defaultActiveKey={defaultActiveKey}
      // tabBarGutter describes the spacing between the tabs.
      tabBarGutter={4}
      activeKey={activeKey}
      onChange={(activeKey: string) => onTabSwitch(activeKey)}
      items={tabComponentList}
      {...rest}
    />
  );
};
