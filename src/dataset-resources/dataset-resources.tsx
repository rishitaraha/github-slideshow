import { TabSwitcher } from '@aus-platform/design-system';
import { Tab } from 'rc-tabs/lib/interface';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layers from 'src/layers';
import { GlobalContext } from 'src/shared/context';
import { FeatureFlag } from 'src/shared/enums';
import { ProgressProvider } from 'src/tasks/contexts';
import { useQueryParam } from 'src/shared/hooks';
import { RoutesEnum } from 'src/shared/routes';
import { ComponentRoute } from 'src/shared/types';
import { Tasks } from 'src/tasks';

export const DatasetResources: React.FC & ComponentRoute = () => {
  // Hooks.
  const navigate = useNavigate();
  const { loggedUser } = useContext(GlobalContext);
  const iterationId = useQueryParam('iterationId') ?? '';

  // Setup.
  const tabComponentList: Tab[] = [
    { label: 'Layers', key: RoutesEnum.Layers, children: <Layers /> },
  ];

  if (loggedUser?.featureFlags[FeatureFlag.ProcessingWorkflow]) {
    tabComponentList.push({
      label: 'Tasks',
      key: RoutesEnum.Tasks,
      children: (
        <ProgressProvider>
          <Tasks iterationId={iterationId} />
        </ProgressProvider>
      ),
    });
  }

  // States.
  const [activeKey, setActiveKey] = useState<RoutesEnum>(RoutesEnum.Layers);

  // UseEffects.
  useEffect(() => {
    if (activeKey && iterationId) {
      navigate(`${activeKey}?iterationId=${iterationId}`);
    }
  }, [activeKey]);

  // Handlers.
  const onTabSwitch = (activeTab) => {
    setActiveKey(activeTab);
  };

  return (
    <div className="screen dataset-resources-tabs">
      <TabSwitcher
        defaultActiveKey={tabComponentList[0].key}
        {...{ activeKey, tabComponentList, onTabSwitch }}
      />
    </div>
  );
};

DatasetResources.route = '/layers';
