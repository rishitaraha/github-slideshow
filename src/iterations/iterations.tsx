import {
  Button,
  ButtonVariant,
  IconIdentifier,
  Table,
  paginationInitialState,
  toast,
} from '@aus-platform/design-system';
import { PaginationState, getCoreRowModel } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CurrentIteration,
  IterationListItem,
  handleResponseErrorMessage,
  useDeleteIteration,
  useIterationsList,
} from '../shared/api';
import { ConfirmationModal, EmptyList } from '../shared/components';
import { GlobalContext, HeaderTitleContext } from '../shared/context';
import { isOrgAdmin, shouldOpenInNewTab } from '../shared/helpers';
import { ComponentRoute } from '../shared/types';
import { AddIteration, EditIteration, SubtractDsmModal } from './components';
import { iterationListColumns } from './helpers';

export const Iterations: React.FC & ComponentRoute = () => {
  // Table States.
  const [paginationProps, setPaginationProps] = useState<PaginationState>(
    paginationInitialState,
  );
  const [pageCount, setPageCount] = useState(0);
  const [tableData, setTableData] = useState<IterationListItem[]>([]);

  // States.
  const [showAddIterationSideCard, setShowAddIterationSideCard] =
    useState(false);
  const [showEditIterationSideCard, setShowEditIterationSideCard] =
    useState(false);
  const [showSubtractDsmModal, setShowSubtractDsmModal] = useState(false);
  const [isUserOrgAdmin, setIsUserOrgAdmin] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [currentIteration, setCurrentIteration] = useState<CurrentIteration>({
    iterationId: '',
    iterationName: '',
  });
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);

  const [searchParams] = useSearchParams();

  // Contexts.
  const {
    setHeaderTitle,
    showSideCard,
    setShowSideCard,
    setHeaderBackButtonRoute,
  } = useContext(HeaderTitleContext);
  const { loggedUser } = useContext(GlobalContext);

  // Hooks.
  const navigate = useNavigate();

  // Api.
  const {
    data: iterationList,
    isSuccess: isSuccessIterationList,
    isLoading: isLoadingIterationList,
    refetch: refetchIterationList,
    isRefetching: isRefetchingIterationList,
  } = useIterationsList(
    {
      siteId: siteId,
      page: paginationProps.pageIndex + 1,
      pageSize: paginationProps.pageSize,
    },
    !isEmpty(siteId),
  );

  const {
    mutate: sendDeleteIterationRequest,
    isSuccess: isSuccessDeleteIteration,
    isError: isErrorDeleteIteration,
    error: deleteIterationError,
  } = useDeleteIteration();

  // useEffects.
  useEffect(() => {
    const querySiteId = searchParams.get('siteId');
    if (querySiteId) {
      setSiteId(querySiteId);
    } else {
      toast.error('Site not found');
      navigate('/projects');
    }
  }, []);

  useEffect(() => {
    if (!showSideCard.secondary) {
      setShowEditIterationSideCard(false);
      setShowAddIterationSideCard(false);
    }
  }, [HeaderTitleContext, showSideCard]);

  useEffect(() => {
    if (isSuccessIterationList && iterationList) {
      setHeaderBackButtonRoute('/sites?projectId=' + iterationList?.projectId);
      setTableData(iterationList.list);
      setPageCount(Math.ceil(iterationList.total / paginationProps.pageSize));
      setHeaderTitle(iterationList.siteName);
    }
  }, [isSuccessIterationList, iterationList]);

  useEffect(() => {
    if (loggedUser) {
      setIsUserOrgAdmin(isOrgAdmin(loggedUser));
    }
  }, [loggedUser]);

  useEffect(() => {
    if (isSuccessDeleteIteration) {
      refetchIterationList();
      hideDeleteConfirmationModal();
      toast.success('Iteration deleted successfully!');
    }

    handleResponseErrorMessage(isErrorDeleteIteration, deleteIterationError);
  }, [isSuccessDeleteIteration, isErrorDeleteIteration, deleteIterationError]);

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPaginationProps({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  // Handlers.
  const openAddIterationSideCard = () => {
    setShowSideCard({ ...showSideCard, secondary: true });
    setShowAddIterationSideCard(true);
  };
  const closeAddIterationSideCard = () => {
    setShowSideCard({ ...showSideCard, secondary: false });
    setShowAddIterationSideCard(false);
  };

  const openEditIterationSideCard = () => {
    setShowSideCard({ ...showSideCard, secondary: true });
    setShowEditIterationSideCard(true);
  };
  const closeEditIterationSideCard = () => {
    setCurrentIteration({ iterationId: '', iterationName: '' });
    setShowSideCard({ ...showSideCard, secondary: false });
    setShowEditIterationSideCard(false);
  };

  const onClickEditIteration = () => {
    openEditIterationSideCard();
  };

  const onClickDeleteIteration = () => {
    setShowDeleteConfirmationModal(true);
  };
  const onDeleteLayerSubmit = () => {
    sendDeleteIterationRequest({
      iterationId: currentIteration.iterationId,
    });
  };
  const hideDeleteConfirmationModal = () => {
    setShowDeleteConfirmationModal(false);
  };

  const onDatasetRowMouseClick = (e: React.MouseEvent, row) => {
    if (shouldOpenInNewTab(e)) {
      window.open(
        `/layers?iterationId=${row.id}`,
        '_blank',
        'noopener,noreferrer',
      );
    } else {
      navigate(`/layers?iterationId=${row.id}`);
    }
  };

  const openSubtractDsmModal = () => setShowSubtractDsmModal(true);
  const closeSubtractDsmModal = () => setShowSubtractDsmModal(false);
  return (
    <div className="screen iteration-list">
      {iterationList?.canManageIterations && (
        <>
          <AddIteration
            show={showAddIterationSideCard && showSideCard.secondary}
            closeAddIteration={closeAddIterationSideCard}
            refetch={refetchIterationList}
          />
          <EditIteration
            show={showEditIterationSideCard && showSideCard.secondary}
            closeEditIteration={closeEditIterationSideCard}
            refetch={refetchIterationList}
            iterationId={currentIteration.iterationId}
          />

          <SubtractDsmModal
            show={showSubtractDsmModal}
            onClose={closeSubtractDsmModal}
            siteId={siteId}
            refetchIterationFn={refetchIterationList}
          />
        </>
      )}
      {isEmpty(tableData) && !isLoadingIterationList ? (
        <EmptyList
          headingText={
            isUserOrgAdmin
              ? 'You’ve not added any Iterations yet'
              : 'No Iterations added yet'
          }
          bodyText={
            !isUserOrgAdmin
              ? 'Please ask your Org Admin to Add/Assign Iterations'
              : undefined
          }
          addButton={
            iterationList?.canManageIterations ? (
              <Button
                onClick={openAddIterationSideCard}
                rightIconIdentifier={IconIdentifier.Plus}
                data-testid="add-iteration-button-empty-list"
              >
                Add Iteration
              </Button>
            ) : null
          }
        />
      ) : (
        <Table
          columns={iterationListColumns({
            canManageIterations: Boolean(iterationList?.canManageIterations),
            setCurrentIteration,
            onClickEditIteration,
            onClickDeleteIteration,
            loggedUser,
          })}
          data={tableData}
          getCoreRowModel={getCoreRowModel()}
          paginationProps={paginationProps}
          pageCount={pageCount}
          onPaginationChange={setPaginationProps}
          onPageSizeChange={onPageSizeChange}
          onMouseClick={onDatasetRowMouseClick}
          isLoading={isLoadingIterationList || isRefetchingIterationList}
          tableHeaderOptions={
            iterationList?.canManageIterations && (
              <div className="iterations__header-btns">
                <Button
                  onClick={openSubtractDsmModal}
                  variant={ButtonVariant.Secondary}
                >
                  Subtract DSM
                </Button>
                <Button
                  onClick={openAddIterationSideCard}
                  rightIconIdentifier={IconIdentifier.Plus}
                  data-testid="add-iteration-btn"
                >
                  Add Iteration
                </Button>
              </div>
            )
          }
        />
      )}
      {showDeleteConfirmationModal && (
        <ConfirmationModal
          title="Delete Iteration"
          message={
            <div>
              Are you sure you want to delete iteration
              <strong> {currentIteration.iterationName} </strong>?
            </div>
          }
          onSubmit={onDeleteLayerSubmit}
          onClose={hideDeleteConfirmationModal}
          confirmText="Delete"
          isConfirmDanger
          onSubmitButtonDataTestId="confirm-delete-iteration-modal"
        />
      )}
    </div>
  );
};

Iterations.route = '/iterations';
