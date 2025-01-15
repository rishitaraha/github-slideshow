import {
  SelectOption,
  SideCard,
  TabSwitcher,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { Tab } from 'rc-tabs/lib/interface';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../../../../../../app/hooks';
import { useAccessTagList } from '../../../../../../../shared/api';
import { selectWorkspaceActionableLayers } from '../../../../../../shared/map-3d-slices';
import { WorkspaceSidecardProps } from '../types';
import { FeatureDetails, FeatureStyling } from '.';

const layerStylingTabLabel = {
  Styling: 'Styling',
  Details: 'Details',
};

export const LayerStylingSidecard: React.FC<WorkspaceSidecardProps> = ({
  show,
  onClose,
  onToggle,
}) => {
  // Selectors.
  const { currentEditableLayer } = useAppSelector(
    selectWorkspaceActionableLayers,
  );

  // States.
  const [activeTab, setActiveTab] = useState(layerStylingTabLabel.Styling);
  const [layerAccessTags, setLayerAccessTags] = useState<
    SelectOption<string>[]
  >([]);

  // Apis.
  const {
    data: accessTagsListResponse,
    isSuccess: isAccessTagListSuccess,
    isLoading: isAccessTagListLoading,
  } = useAccessTagList(undefined, !isNil(currentEditableLayer));

  // useMemos.
  const featureTabList: Tab[] = useMemo(() => {
    return [
      {
        label: layerStylingTabLabel.Styling,
        children: <FeatureStyling />,
        key: layerStylingTabLabel.Styling,
      },
      {
        label: layerStylingTabLabel.Details,
        children: (
          <FeatureDetails
            layerAccessTags={layerAccessTags}
            isAccessTagListLoading={isAccessTagListLoading}
          />
        ),
        key: layerStylingTabLabel.Details,
      },
    ];
  }, [layerAccessTags, isAccessTagListLoading]);

  // useEffects.
  useEffect(() => {
    if (isAccessTagListSuccess && accessTagsListResponse) {
      const layerAccessTags = accessTagsListResponse.data.list
        .filter((accessTags) => {
          return currentEditableLayer?.accessTags?.includes(accessTags.id);
        })
        .map((accessTag) => {
          return {
            label: accessTag.name,
            value: accessTag.id,
          };
        });
      setLayerAccessTags(layerAccessTags);
    }
  }, [isAccessTagListSuccess, accessTagsListResponse]);

  return (
    <SideCard
      className="layer-styling-sidecard"
      title={currentEditableLayer?.name}
      onClose={onClose}
      show={show}
      showCloseButton={false}
      backdrop={false}
      onClickToggleSidecardButton={onToggle}
    >
      <TabSwitcher
        tabComponentList={featureTabList}
        activeKey={activeTab}
        onTabSwitch={(tabKey: string) => {
          setActiveTab(tabKey);
        }}
      />
    </SideCard>
  );
};
