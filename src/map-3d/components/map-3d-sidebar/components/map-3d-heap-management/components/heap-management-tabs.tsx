import { Tab } from 'rc-tabs/lib/interface';
import { heapTabs } from '../constants';
import { HeapApiOptionType } from '../types';
import { HeapList, HeapManagementGuide, VolumeCalculation } from '.';

export const HeapManagementTabs = ({
  heapListResponse,
  isHeapListLoading,
  heapListRefetch,
  selectedHeaps,
  onSelectHeapHandler,
  setActiveTabKey,
}: HeapApiOptionType): Tab[] => {
  return [
    {
      label: heapTabs.Draw,
      children: (
        <VolumeCalculation
          heapListRefetch={heapListRefetch}
          onSelectHeapHandler={onSelectHeapHandler}
          setActiveTabKey={setActiveTabKey}
        />
      ),
      key: heapTabs.Draw,
    },
    {
      label: heapTabs.List,
      children: (
        <HeapList
          heapListResponse={heapListResponse}
          isHeapListLoading={isHeapListLoading}
          heapListRefetch={heapListRefetch}
          selectedHeaps={selectedHeaps}
          onSelectHeapHandler={onSelectHeapHandler}
          setActiveTabKey={setActiveTabKey}
        />
      ),
      key: heapTabs.List,
    },
    {
      label: heapTabs.Guide,
      children: <HeapManagementGuide />,
      key: heapTabs.Guide,
    },
  ];
};
