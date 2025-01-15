import { Tab } from 'rc-tabs/lib/interface';
import { haulRoadAnalyticsTabs } from './enums';
import { HRAOutputs } from './hra-outputs/hra-outputs';
import { HRAGenerateForm } from './hra-generate-form';

export const HaulRoadAnalyticsTabs = ({
  setActiveTabKey,
  activeTabKey,
}): Tab[] => {
  return [
    {
      label: haulRoadAnalyticsTabs.Outputs,
      children: <HRAOutputs activeTabKey={activeTabKey} />,
      key: haulRoadAnalyticsTabs.Outputs,
    },
    {
      label: haulRoadAnalyticsTabs.Generate,
      children: <HRAGenerateForm setActiveTabKey={setActiveTabKey} />,
      key: haulRoadAnalyticsTabs.Generate,
    },
    {
      label: haulRoadAnalyticsTabs.Guide,
      children: <h1>Guide Page</h1>,
      key: haulRoadAnalyticsTabs.Guide,
    },
  ];
};
