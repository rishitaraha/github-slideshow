import {
  Breadcrumb,
  Button,
  Input,
  InputSearchVariant,
  Placement,
  SideCard,
  SideCardLocation,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { DatasetDetailsTooltip } from '../../shared/components';
import { DatasetSidecardHeadingMapper } from './constants';
import { getCurrentDatasetSidecard } from './helpers';
import { SidecardIterationList } from './sidecard-iteration-list';
import { SidecardLayerList } from './sidecard-layer-list';
import { SidecardSiteList } from './sidecard-site-list';
import { SelectDatasetSidecardProps } from './types';
import { DatasetList, SearchPlaceholder } from '.';
import {
  WorkspaceRightSideCard,
  selectMap3dDataset,
  setActiveWorkspaceIteration,
  setActiveWorkspaceSite,
  setRightSideCard,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const SelectDatasetSidecard: React.FC<SelectDatasetSidecardProps> = ({
  show,
  onClose,
  onClickCreateLayer,
}) => {
  // Dispatcher.
  const dispatch = useAppDispatch();

  // Selectors.
  const {
    selectedProject,
    activeWorkspaceSite,
    activeWorkspaceIteration,
    canManageIterationsAndLayers,
  } = useAppSelector(selectMap3dDataset);

  // States.
  const [searchPlaceholder, setSearchPlaceholder] = useState<string>(
    SearchPlaceholder.Empty,
  );
  const [searchText, setSearchText] = useState('');

  // Constants.
  const currentSidecardContent = getCurrentDatasetSidecard(
    selectedProject?.id,
    activeWorkspaceSite?.id,
    activeWorkspaceIteration?.id,
  );

  const sidecardHeading = DatasetSidecardHeadingMapper[currentSidecardContent];

  // useEffects.
  useEffect(() => {
    setSearchText('');
    switch (currentSidecardContent) {
      case DatasetList.Layer:
        setSearchPlaceholder(SearchPlaceholder.Layer);
        break;
      case DatasetList.Iteration:
        setSearchPlaceholder(SearchPlaceholder.Iteration);
        break;
      case DatasetList.Site:
        setSearchPlaceholder(SearchPlaceholder.Site);
        break;
    }
  }, [currentSidecardContent]);

  // Handlers.
  const onSearchDataset = (event) => {
    setSearchText(event.target.value);
  };

  const goToPreviousDatasetList = () => {
    // Clear search input.
    setSearchText('');

    switch (currentSidecardContent) {
      case DatasetList.Layer:
        dispatch(setActiveWorkspaceIteration(null));
        break;
      case DatasetList.Iteration:
        dispatch(setActiveWorkspaceSite(null));
        break;
      default:
        dispatch(setRightSideCard(WorkspaceRightSideCard.None));
    }
  };

  const onSideCardClose = () => {
    onClose();
  };

  // Renders.
  const renderDatasetList = () => {
    if (currentSidecardContent === DatasetList.Layer) {
      return <SidecardLayerList searchQuery={searchText} />;
    } else if (currentSidecardContent === DatasetList.Iteration) {
      return <SidecardIterationList searchQuery={searchText} />;
    } else if (currentSidecardContent === DatasetList.Site) {
      return <SidecardSiteList searchQuery={searchText} />;
    }
  };

  const HeaderButton = () => {
    if (!canManageIterationsAndLayers) {
      const tooltipMessage = activeWorkspaceSite
        ? 'No manage iterations & layers permission for selected site'
        : 'No manage iterations & layers permission for any site';
      return (
        <Tooltip hoverText={tooltipMessage} placement={Placement.Bottom}>
          <Button onClick={onClickCreateLayer} disabled={true}>
            Create Layer
          </Button>
        </Tooltip>
      );
    } else {
      return (
        <Button
          onClick={onClickCreateLayer}
          data-testid="dataset-sidecard-create-layer-button"
        >
          Create Layer
        </Button>
      );
    }
  };

  const DatasetSidecardBreadcrumb = () => {
    const showTooltip =
      (activeWorkspaceSite && activeWorkspaceSite.name.length > 40) ||
      !isNil(activeWorkspaceIteration);

    const DatasetBreadcrumb = () => (
      <Breadcrumb onClickBackButton={goToPreviousDatasetList}>
        <Breadcrumb.Item
          onClick={
            activeWorkspaceIteration ? goToPreviousDatasetList : undefined
          }
        >
          {activeWorkspaceSite?.name}
        </Breadcrumb.Item>
        {activeWorkspaceIteration && (
          <Breadcrumb.Item>{activeWorkspaceIteration.name}</Breadcrumb.Item>
        )}
      </Breadcrumb>
    );

    return showTooltip ? (
      <DatasetDetailsTooltip
        siteName={activeWorkspaceSite?.name}
        iterationName={activeWorkspaceIteration?.name}
        placement={Placement.Left}
      >
        <DatasetBreadcrumb />
      </DatasetDetailsTooltip>
    ) : (
      <DatasetBreadcrumb />
    );
  };

  return (
    <SideCard
      className="select-dataset-sidecard"
      placement={SideCardLocation.End}
      title={sidecardHeading}
      onClose={onSideCardClose}
      showCloseButton={true}
      show={show}
      backdrop={false}
      data-testid="right-hand-dataset-sidecard"
      headerChildren={<HeaderButton />}
    >
      <div className="select-dataset-list-container">
        {activeWorkspaceSite && <DatasetSidecardBreadcrumb />}
        <Input.Search
          value={searchText}
          onChange={onSearchDataset}
          placeholder={`Search by ${searchPlaceholder} name`}
          variant={InputSearchVariant.NoButton}
        />
        <div
          className="select-dataset-list"
          data-testid="dataset-list-container"
        >
          {renderDatasetList()}
        </div>
      </div>
    </SideCard>
  );
};
