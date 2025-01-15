import { TabSwitcher } from '@aus-platform/design-system';
import { has, omit } from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../../../../app/hooks';
import {
  HeapResponseDataTypeObj,
  useHeapList,
} from '../../../../../shared/api';
import {
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dHeap,
  setPolygonTool,
} from '../../../../shared/map-3d-slices';
import { PolygonTool } from '../../../../shared/map-3d-tools';
import { Map3DNoTerrainSelected } from '../../shared';
import { HeapManagementTabs, SelectedHeapType } from './components';
import { heapTabs } from '.';

export const Map3DHeapManagement = () => {
  // States.
  const [selectedHeaps, setSelectedHeaps] = useState<SelectedHeapType | null>(
    null,
  );

  const [activeTabKey, setActiveTabKey] = useState(heapTabs.Draw);

  // Selectors.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { polygonTool } = useAppSelector(selectMap3dHeap);

  // Hooks.
  const dispatch = useDispatch();

  // Api.
  const {
    data: heapListResponse,
    isSuccess: isHeapListSuccess,
    isLoading: isHeapListLoading,
    refetch: heapListRefetch,
  } = useHeapList({ id: selectedTerrainIteration?.id ?? '' }, false);

  useEffect(() => {
    if (cesiumProxy) {
      dispatch(setPolygonTool(new PolygonTool(cesiumProxy.cesiumViewer)));
    }
    return () => {
      polygonTool?.destroy();
    };
  }, []);

  useEffect(() => {
    // Adding polygon tool as dependency to ensure using the updated value when unmounting.
    return () => {
      // @TODO - use deleteAllPolygons function when the importWkt function is updated to return polygons with different IDs for MULTIPOLYGON WKT.
      polygonTool?.deletePolygonsByProperty('isHeap', true);
    };
  }, [polygonTool]);

  useEffect(() => {
    if (selectedTerrainIteration?.id && !isHeapListSuccess) {
      heapListRefetch();
    }
  }, [isHeapListSuccess]);

  // Handlers.
  const onSelectHeapHandler = (selectedHeap: HeapResponseDataTypeObj) => {
    // Checking if the heap is already selected or not.
    if (!has(selectedHeaps, selectedHeap.id)) {
      setSelectedHeaps((previousSelectedHeap) => {
        return {
          ...previousSelectedHeap,
          [selectedHeap.id]: {
            ...selectedHeap,
          },
        };
      });

      polygonTool?.importWKT(
        selectedHeap.geometry,
        selectedHeap.id,
        { heapId: selectedHeap.id, isHeap: true },
        selectedHeap.name,
      );
    } else {
      polygonTool?.deletePolygonsByProperty('heapId', selectedHeap.id);

      setSelectedHeaps((previousSelectedHeaps) => {
        // Remove heap from the list of selected heaps.
        return omit(previousSelectedHeaps, selectedHeap.id);
      });
    }
  };

  const onTabSwitch = (tabKey: string) => {
    setActiveTabKey(tabKey);

    if (tabKey !== heapTabs.List && tabKey !== heapTabs.Guide) {
      polygonTool?.deletePolygonsByProperty('isHeap', true);
      setSelectedHeaps(null);
    }
  };

  return (
    <div className="map-3d-heap-management__container">
      {selectedTerrainIteration?.id ? (
        <TabSwitcher
          tabComponentList={HeapManagementTabs({
            heapListResponse,
            isHeapListLoading,
            heapListRefetch,
            selectedHeaps,
            onSelectHeapHandler,
            setActiveTabKey,
          })}
          activeKey={activeTabKey}
          onTabSwitch={(tabKey) => onTabSwitch(tabKey)}
        />
      ) : (
        <Map3DNoTerrainSelected className="map-3d-sidebar-content" />
      )}
    </div>
  );
};
