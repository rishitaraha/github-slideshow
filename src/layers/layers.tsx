import {
  Button,
  IconIdentifier,
  Table,
  paginationInitialState,
  toast,
} from '@aus-platform/design-system';
import { PaginationState, getCoreRowModel } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import classnames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import {
  CurrentLayer,
  useDeleteLayer,
  useLayerList,
  LayerListItem,
  handleResponseErrorMessage,
} from '../shared/api';
import { ConfirmationModal, EmptyList } from '../shared/components';
import { GlobalContext, HeaderTitleContext } from '../shared/context';
import { AccessType } from '../sites/components/enums';
import { AddLayers, EditLayers } from './components';
import { layerListColumns } from './helpers/layer-list-column-data';
import { ComponentRoute } from 'shared/types';
import { RoutesEnum } from 'shared/routes';

// index value -1 signifies that the index is empty.
const initialLayerData: CurrentLayer = {
  id: '',
  name: '',
};

export const Layers: React.FC & ComponentRoute = () => {
  // Table States.
  const [pageCount, setPageCount] = useState(0);
  const [paginationProps, setPagination] = useState<PaginationState>(
    paginationInitialState,
  );
  const [tableData, setTableData] = useState<LayerListItem[]>([]);
  // Contexts.
  const {
    headerTitle,
    setHeaderTitle,
    showSideCard,
    setShowSideCard,
    setHeaderBackButtonRoute,
  } = useContext(HeaderTitleContext);
  const { loggedUser } = useContext(GlobalContext);

  const navigate = useNavigate();
  const { search } = useLocation();

  // useStates.
  const [showAddLayerSideCard, setShowAddLayerSideCard] = useState(false);
  const [showEditLayerSideCard, setShowEditLayerSideCard] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [currentLayer, setCurrentLayer] =
    useState<CurrentLayer>(initialLayerData);
  const [iterationId, setIterationId] = useState('');
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(
    null,
  );
  const [requestedLayerId, setRequestedLayerId] = useState(
    new URLSearchParams(search).get('highlightLayer'),
  );

  // Hooks.
  const {
    data: layerList,
    isLoading: isLoadingLayerList,
    isSuccess: isSuccessLayerList,
    refetch: refetchLayerList,
    isRefetching: isRefetchingLayerList,
  } = useLayerList(
    {
      iterationId,
      includeFields: ['id', 'type', 'name', 'files', 'clampedStatus', 'tiles'],
      page: paginationProps.pageIndex + 1,
      pageSize: paginationProps.pageSize,
      requestedLayerId: requestedLayerId,
    },
    !!iterationId,
  );

  const {
    mutate: sendDeleteLayerRequest,
    isSuccess: isSuccessDeleteLayer,
    isError: isErrorDeleteLayer,
    isPending: isLoadingDeleteLayer,
    error: deleteLayerError,
  } = useDeleteLayer();

  // useEffects.
  useEffect(() => {
    const queryIterationId = new URLSearchParams(search).get('iterationId');
    if (queryIterationId) {
      setIterationId(queryIterationId);
    } else {
      toast.error('Iteration not found');
      navigate('projects');
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setRequestedLayerId(null);
    }, 5000);

    // Create a new URLSearchParams object from the 'search' parameter. Remove the 'highlightLayer' parameter from the search parameters.
    const searchParams = new URLSearchParams(search);
    searchParams.delete('highlightLayer');

    // Convert the updated search parameters back to a string. Initialize the new URL with the base path '/layers'.
    const newSearchString = searchParams.toString();
    let newUrl = `/layers`;

    //  Check if there are any search parameters to append. Append and Replace the current URL in the browser's history with the new URL.
    if (newSearchString) {
      newUrl += `?${newSearchString}`;
    }
    window.history.replaceState({}, '', newUrl);
    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (!showSideCard.secondary) {
      setShowAddLayerSideCard(false);
    }
  }, [HeaderTitleContext, showSideCard]);

  useEffect(() => {
    if (isSuccessLayerList) {
      setTableData(layerList.list);

      if (layerList.iterationName !== headerTitle) {
        setHeaderTitle(layerList.iterationName);
      }

      setHeaderBackButtonRoute('/iterations?siteId=' + layerList?.siteId);
      setPageCount(Math.ceil(layerList.total / paginationProps.pageSize));
    }

    if (layerList?.requestedLayerId) {
      setPagination({
        pageIndex: layerList.pageNumber - 1,
        pageSize: paginationProps.pageSize,
      });
    }

    let rowIndex: number | null = null;
    if (requestedLayerId && layerList) {
      const index = layerList.list.findIndex(
        (row) => row.id === requestedLayerId,
      );
      rowIndex = index !== -1 ? index : null;
    }

    setHighlightedRowIndex(rowIndex);
  }, [isSuccessLayerList, layerList]);

  useEffect(() => {
    if (isSuccessDeleteLayer) {
      refetchLayerList();
      toast.success('Layer deleted successfully.');
      hideDeleteConfirmationModal();
    }

    handleResponseErrorMessage(isErrorDeleteLayer, deleteLayerError);
  }, [isSuccessDeleteLayer, isErrorDeleteLayer, deleteLayerError]);

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPagination({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  // Handlers.
  const toggleSideCard = () => {
    setShowSideCard({ ...showSideCard, secondary: !showSideCard.secondary });
  };

  const openAddLayer = () => {
    toggleSideCard();
    setShowAddLayerSideCard(true);
  };
  const closeAddLayer = () => {
    toggleSideCard();
    setShowAddLayerSideCard(false);
  };

  const openEditLayer = () => {
    setShowEditLayerSideCard(true);
    toggleSideCard();
  };

  const closeEditLayer = () => {
    toggleSideCard();
    setShowEditLayerSideCard(false);
  };

  const onDeleteLayerSubmit = () => {
    sendDeleteLayerRequest({
      id: currentLayer.id,
      iteration: iterationId,
    });
  };

  const hideDeleteConfirmationModal = () => setShowDeleteConfirmation(false);
  const showDeleteConfirmationModal = () => setShowDeleteConfirmation(true);

  const onClickDeleteLayer = () => {
    showDeleteConfirmationModal();
  };

  const isAccessTagsTabHidden = () => {
    if (layerList) {
      return layerList.accessType === AccessType.Basic;
    }
    return false;
  };

  const reloadLayerList = () => {
    refetchLayerList();
  };

  const highlightedLayerClassGenerator = (row) => {
    return classnames('layer-list__table-row', {
      'layer-list__table-row--highlighted': row && requestedLayerId === row.id,
    });
  };

  return (
    <div className="layer-list">
      <>
        {layerList?.canManageLayers && (
          <>
            <AddLayers
              showSideCard={showAddLayerSideCard && showSideCard.secondary}
              closeAddLayer={closeAddLayer}
              refetchLayerList={refetchLayerList}
              isAccessTagsTabHidden={isAccessTagsTabHidden()}
            />

            <EditLayers
              showSideCard={showEditLayerSideCard && showSideCard.secondary}
              closeEditLayer={closeEditLayer}
              refetchLayerList={refetchLayerList}
              layerId={currentLayer.id}
              isAccessTagsTabHidden={isAccessTagsTabHidden()}
            />
          </>
        )}

        {isEmpty(tableData) && !isLoadingLayerList ? (
          <EmptyList
            headingText={"You've not added any Layers."}
            addButton={
              layerList?.canManageLayers && (
                <Button
                  className="layers-list__options__add-layer-btn"
                  leftIconIdentifier={IconIdentifier.Plus}
                  onClick={openAddLayer}
                  data-testid="add-layer-btn-initial"
                >
                  Add Layer
                </Button>
              )
            }
            bodyText={
              layerList?.canManageLayers ? 'Do you want to add a layer?' : ''
            }
          />
        ) : (
          <Table
            columns={layerListColumns({
              setCurrentLayer,
              onClickDeleteLayer,
              openEditLayer,
              canManageLayers: layerList?.canManageLayers,
              hasDSM: layerList?.hasDSM,
              reloadLayerList,
              loggedUser,
            })}
            data={tableData}
            rowClassesGenerator={highlightedLayerClassGenerator}
            isLoading={isLoadingLayerList || isRefetchingLayerList}
            getCoreRowModel={getCoreRowModel()}
            paginationProps={paginationProps}
            pageCount={pageCount}
            onPaginationChange={setPagination}
            onPageSizeChange={onPageSizeChange}
            tableHeaderOptions={
              layerList?.canManageLayers && (
                <Button
                  className="layers-list__options__add-layer-btn"
                  leftIconIdentifier={IconIdentifier.Plus}
                  onClick={openAddLayer}
                  data-testid="add-layer-btn"
                >
                  Add Layer
                </Button>
              )
            }
            scrollToRowId={highlightedRowIndex}
          />
        )}
        {showDeleteConfirmation && (
          <ConfirmationModal
            title="Delete Layer"
            message={
              <div>
                Are you sure you want to delete layer
                <strong> {currentLayer.name}? </strong>
              </div>
            }
            onSubmit={onDeleteLayerSubmit}
            onClose={hideDeleteConfirmationModal}
            isConfirmButtonLoading={isLoadingDeleteLayer}
            onCloseButtonDataTestId="cancel-delete-layer-button"
            onSubmitButtonDataTestId="confirm-delete-layer-button"
          />
        )}
      </>
    </div>
  );
};

Layers.route = RoutesEnum.Layers;
