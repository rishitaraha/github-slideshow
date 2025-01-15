import {
  Button,
  IconIdentifier,
  Table,
  paginationInitialState,
} from '@aus-platform/design-system';
import { PaginationState, getCoreRowModel } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import {
  AccessTagObj,
  handleResponseSuccessMessage,
  useAccessTagList,
  useAddAccessTagRequest,
  useDeleteAccessTagRequest,
  useUpdateAccessTagRequest,
} from '../shared/api';
import { ConfirmationModal, EmptyList } from '../shared/components';
import { HeaderTitleContext } from '../shared/context';
import { CreateAccessTagModal, EditAccessTagModal } from './components';
import { accessTagListColumns } from './helpers';

export const AccessTags: React.FC = () => {
  // Table States.
  const [paginationProps, setPaginationProps] = useState<PaginationState>(
    paginationInitialState,
  );
  const [pageCount, setPageCount] = useState(0);
  const [tableData, setTableData] = useState<AccessTagObj[]>([]);

  // States.
  const [showCreateAccessTagModal, setShowCreateAccessTagModal] =
    useState(false);
  const [showEditAccessTagModal, setShowEditAccessTagModal] = useState(false);
  const [showDeleteAccessTagConfirmation, setShowDeleteAccessTagConfirmation] =
    useState(false);
  const [currentAccessTag, setCurrentAccessTag] = useState<AccessTagObj | null>(
    null,
  );

  // Contexts.
  const { setHeaderTitle } = useContext(HeaderTitleContext);

  // Api.
  const {
    data: accessTagListResponse,
    isSuccess: isSuccessAccessTagList,
    refetch: refetchAccessTagList,
    isLoading: isLoadingAccessTagList,
  } = useAccessTagList({
    page: paginationProps.pageIndex + 1,
    pageSize: paginationProps.pageSize,
  });

  const {
    mutate: sendAddAccessTagRequest,
    data: addAccessTagRequestResponse,
    error: addAccessTagRequestErrorResponse,
    isSuccess: isSuccessAddAccessTagRequest,
    isPending: isLoadingAddAccessTagRequest,
    reset: resetAddAccessTagRequest,
  } = useAddAccessTagRequest();

  const {
    mutate: sendUpdateAccessTagRequest,
    data: updateAccessTagRequestResponse,
    error: updateAccessTagRequestErrorResponse,
    isSuccess: isSuccessUpdateAccessTagRequest,
    isPending: isLoadingUpdateAccessTagRequest,
    reset: resetUpdateAccessTagRequest,
  } = useUpdateAccessTagRequest();

  const {
    mutate: sendDeleteAccessTagRequest,
    data: deleteAccessTagRequestResponse,
    isSuccess: isSuccessDeleteAccessTagRequest,
  } = useDeleteAccessTagRequest();

  // useEffect - Mount.
  useEffect(() => {
    setHeaderTitle('Access Tags');
    return () => setHeaderTitle('');
  }, []);

  // useEffect - accessTagListResponse, isSuccessAccessTagList
  useEffect(() => {
    if (accessTagListResponse && isSuccessAccessTagList) {
      setTableData(accessTagListResponse.data.list);
      setPageCount(
        Math.ceil(accessTagListResponse.data.total / paginationProps.pageSize),
      );
    }
  }, [accessTagListResponse, isSuccessAccessTagList]);

  // useEffect -  addAccessTagRequestResponse, isSuccessAddAccessTagRequest.
  useEffect(() => {
    if (isSuccessAddAccessTagRequest && addAccessTagRequestResponse) {
      handleResponseSuccessMessage(
        isSuccessAddAccessTagRequest,
        addAccessTagRequestResponse,
      );
      hideCreateAccessTagModal();
      refetchAccessTagList();
    }
  }, [addAccessTagRequestResponse, isSuccessAddAccessTagRequest]);

  // useEffect -  updateAccessTagRequestResponse, isSuccessUpdateAccessTagRequest.
  useEffect(() => {
    if (isSuccessUpdateAccessTagRequest && updateAccessTagRequestResponse) {
      handleResponseSuccessMessage(
        isSuccessUpdateAccessTagRequest,
        updateAccessTagRequestResponse,
      );
      hideEditAccessTagModal();
      refetchAccessTagList();
    }
  }, [updateAccessTagRequestResponse, isSuccessUpdateAccessTagRequest]);

  // useEffect -  deleteAccessTagRequestResponse, isSuccessdeleteAccessTagRequest
  useEffect(() => {
    if (isSuccessDeleteAccessTagRequest && deleteAccessTagRequestResponse) {
      handleResponseSuccessMessage(
        isSuccessDeleteAccessTagRequest,
        deleteAccessTagRequestResponse,
      );
      hideDeleteAccessTagConfirmation();
      refetchAccessTagList();
    }
  }, [deleteAccessTagRequestResponse, isSuccessDeleteAccessTagRequest]);

  // Handlers.
  const onCreateAccessTag = (tagName: string, color: string) => {
    sendAddAccessTagRequest({ tagName, color });
  };

  const onUpdateAccessTag = (tagName?: string, color?: string) => {
    if (currentAccessTag) {
      sendUpdateAccessTagRequest({ id: currentAccessTag.id, tagName, color });
    }
  };

  const onDeleteAccessTag = () => {
    if (currentAccessTag) {
      sendDeleteAccessTagRequest({ id: currentAccessTag.id });
    }
  };

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPaginationProps({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  const onEditAccessTagClick = (accessTag: AccessTagObj) => {
    displayEditAccessTagModal();
    setCurrentAccessTag(accessTag);
  };

  const onDeleteAccessTagClick = (accessTag: AccessTagObj) => {
    displayDeleteAccessTagConfirmation();
    setCurrentAccessTag(accessTag);
  };

  // Modal Handlers.
  const displayCreateAccessTagModal = () => {
    setShowCreateAccessTagModal(true);
  };

  const hideCreateAccessTagModal = () => {
    setShowCreateAccessTagModal(false);
    resetAddAccessTagRequest();
  };

  const displayEditAccessTagModal = () => {
    setShowEditAccessTagModal(true);
  };

  const hideEditAccessTagModal = () => {
    setShowEditAccessTagModal(false);
    resetUpdateAccessTagRequest();
  };

  const displayDeleteAccessTagConfirmation = () => {
    setShowDeleteAccessTagConfirmation(true);
  };

  const hideDeleteAccessTagConfirmation = () => {
    setShowDeleteAccessTagConfirmation(false);
    resetUpdateAccessTagRequest();
  };

  return (
    <div className="screen access-tags">
      {isEmpty(tableData) && !isLoadingAccessTagList ? (
        <EmptyList
          headingText="You’ve not added any Access Tags yet"
          addButton={
            <Button
              rightIconIdentifier={IconIdentifier.Plus}
              onClick={displayCreateAccessTagModal}
            >
              Create Access Tag
            </Button>
          }
        />
      ) : (
        <Table
          columns={accessTagListColumns(
            onEditAccessTagClick,
            onDeleteAccessTagClick,
          )}
          data={tableData}
          getCoreRowModel={getCoreRowModel()}
          paginationProps={paginationProps}
          pageCount={pageCount}
          onPaginationChange={setPaginationProps}
          onPageSizeChange={onPageSizeChange}
          tableHeaderOptions={
            <Button
              leftIconIdentifier={IconIdentifier.Plus}
              onClick={displayCreateAccessTagModal}
            >
              Create Access Tag
            </Button>
          }
          isLoading={isLoadingAccessTagList}
        />
      )}

      {showCreateAccessTagModal && (
        <CreateAccessTagModal
          onCreate={onCreateAccessTag}
          onClose={hideCreateAccessTagModal}
          isLoading={isLoadingAddAccessTagRequest}
          apiError={addAccessTagRequestErrorResponse}
        />
      )}
      {showEditAccessTagModal && (
        <EditAccessTagModal
          accessTag={currentAccessTag}
          onUpdate={onUpdateAccessTag}
          onClose={hideEditAccessTagModal}
          isLoading={isLoadingUpdateAccessTagRequest}
          apiError={updateAccessTagRequestErrorResponse}
        />
      )}
      {showDeleteAccessTagConfirmation && (
        <ConfirmationModal
          isConfirmDanger
          title="Delete Access Tag"
          message="Are you sure you want to delete this Access Tag?"
          confirmText="Delete"
          cancelText="Cancel"
          onSubmit={onDeleteAccessTag}
          onClose={hideDeleteAccessTagConfirmation}
        />
      )}
    </div>
  );
};
