import {
  Button,
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
  CurrentSite,
  SiteListItem,
  User,
  handleResponseErrorMessage,
  useDeleteSite,
  useSiteList,
} from '../shared/api';
import { ConfirmationModal, EmptyList } from '../shared/components';
import { GlobalContext, HeaderTitleContext } from '../shared/context';
import { isOrgAdmin } from '../shared/helpers';
import { ComponentRoute } from '../shared/types';
import { AddSite, EditSite } from './components';
import { siteListColumns } from './helpers/site-list-column-data';

export const Sites: React.FC & ComponentRoute = () => {
  // Table States.
  const [paginationProps, setPagination] = useState<PaginationState>(
    paginationInitialState,
  );
  const [pageCount, setPageCount] = useState(0);
  const [tableData, setTableData] = useState<SiteListItem[]>([]);

  // States.
  const [showAddSite, setShowAddSite] = useState(false);
  const [showEditSite, setShowEditSite] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSite, setCurrentSite] = useState<CurrentSite>({
    siteId: '',
    siteName: '',
  });
  const [projectId, setProjectId] = useState('');
  const [enableQuery, setEnableQuery] = useState(false);

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
    data: siteList,
    isSuccess: isSuccessSiteList,
    isLoading: isLoadingSiteList,
    refetch: siteListRefetch,
    isRefetching: isRefetchingSiteList,
  } = useSiteList(
    {
      projectId: projectId,
      page: paginationProps.pageIndex + 1,
      pageSize: paginationProps.pageSize,
      excludeFields: ['canManageIterationsAndLayers'],
    },
    enableQuery,
  );

  const {
    mutate: sendDeleteSiteRequest,
    isSuccess: isSuccessDeleteSite,
    isError: isErrorDeleteSite,
    isPending: isLoadingDeleteSite,
    error: deleteSiteError,
  } = useDeleteSite();

  // useEffects.
  useEffect(() => {
    const queryProjectId = searchParams.get('projectId');

    if (queryProjectId) {
      setProjectId(queryProjectId);
      setEnableQuery(true);
    } else {
      toast.error('Project not found');
      navigate('/projects');
    }
    setHeaderBackButtonRoute('/projects/');
  }, []);

  useEffect(() => {
    if (loggedUser) {
      setCurrentUser(loggedUser);
    }
  }, [loggedUser]);

  useEffect(() => {
    if (!showSideCard.secondary) {
      setShowEditSite(false);
      setShowAddSite(false);
    }
  }, [HeaderTitleContext, showSideCard.primary]);

  useEffect(() => {
    if (isSuccessSiteList && siteList) {
      setTableData(siteList.list);
      setPageCount(Math.ceil(siteList.total / paginationProps.pageSize));
      setHeaderTitle(siteList.project);
    }
  }, [isSuccessSiteList, siteList]);

  useEffect(() => {
    if (isSuccessDeleteSite) {
      siteListRefetch();
      toast.success('Site deleted successfully.');
      hideDeleteConfirmationModal();
    }

    handleResponseErrorMessage(isErrorDeleteSite, deleteSiteError);
  }, [isSuccessDeleteSite, isErrorDeleteSite, deleteSiteError]);

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPagination({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  // Handlers.
  const showSecondarySideCardFunc = () => {
    setShowSideCard({ ...showSideCard, secondary: true });
  };

  const hideSecondarySidecardFunc = () => {
    setShowSideCard({ ...showSideCard, secondary: false });
  };

  const openAddSiteSideCard = () => {
    setShowAddSite(true);
    showSecondarySideCardFunc();
  };

  const closeAddSiteSideCard = () => {
    setShowAddSite(false);
    hideSecondarySidecardFunc();
  };

  const openEditSiteSideCard = () => {
    setShowEditSite(true);
    showSecondarySideCardFunc();
  };

  const closeEditSiteSideCard = () => {
    setShowEditSite(false);
    hideSecondarySidecardFunc();
  };

  const onDeleteSiteSubmit = () => {
    sendDeleteSiteRequest({
      siteId: currentSite.siteId,
    });
  };

  const hideDeleteConfirmationModal = () => setShowDeleteConfirmation(false);
  const showDeleteConfirmationModal = () => setShowDeleteConfirmation(true);

  const onClickDeleteSite = () => {
    showDeleteConfirmationModal();
  };

  return (
    <div className="screen site-list">
      {isEmpty(tableData) && !isLoadingSiteList ? (
        <EmptyList
          headingText={
            isOrgAdmin(currentUser)
              ? 'You’ve not added any Sites yet'
              : 'No Sites added yet'
          }
          bodyText={
            !isOrgAdmin(currentUser)
              ? 'Please ask your Org Admin to Add/Assign Iterations'
              : undefined
          }
          addButton={
            isOrgAdmin(currentUser) ? (
              <Button
                className="site-list__add-site-btn"
                rightIconIdentifier={IconIdentifier.Plus}
                onClick={openAddSiteSideCard}
                data-testid="test-add-site-btn-no-site"
              >
                Add Site
              </Button>
            ) : null
          }
        />
      ) : (
        <Table
          columns={siteListColumns(
            setCurrentSite,
            onClickDeleteSite,
            openEditSiteSideCard,
            navigate,
            isOrgAdmin(currentUser),
            siteList?.canManageSites,
          )}
          data={tableData}
          isLoading={isLoadingSiteList || isRefetchingSiteList}
          getCoreRowModel={getCoreRowModel()}
          paginationProps={paginationProps}
          pageCount={pageCount}
          onPaginationChange={setPagination}
          onPageSizeChange={onPageSizeChange}
          tableHeaderOptions={
            isOrgAdmin(currentUser) && (
              <Button
                className="site-list__add-site-btn"
                rightIconIdentifier={IconIdentifier.Plus}
                onClick={openAddSiteSideCard}
                data-testid="test-add-site-btn"
              >
                Add Site
              </Button>
            )
          }
        />
      )}
      {isOrgAdmin(currentUser) && (
        <AddSite
          showSideCard={showAddSite && showSideCard.secondary}
          closeAddSite={closeAddSiteSideCard}
          refetchSiteList={siteListRefetch}
        />
      )}
      {(isOrgAdmin(currentUser) || siteList?.canManageSites) && (
        <EditSite
          showSideCard={showEditSite && showSideCard.secondary}
          closeEditSite={closeEditSiteSideCard}
          refetchSite={siteListRefetch}
          siteId={currentSite.siteId}
          resetSiteId={() => setCurrentSite({ ...currentSite, siteId: '' })}
        />
      )}
      {showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete Site"
          message={
            <div>
              Are you sure you want to delete site
              <strong> {currentSite.siteName}? </strong>
            </div>
          }
          onSubmit={onDeleteSiteSubmit}
          onClose={hideDeleteConfirmationModal}
          isConfirmButtonLoading={isLoadingDeleteSite}
        />
      )}
    </div>
  );
};

Sites.route = '/sites';
