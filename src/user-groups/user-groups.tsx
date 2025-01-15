import {
  Button,
  IconIdentifier,
  Input,
  Table,
} from '@aus-platform/design-system';
import { PaginationState, getCoreRowModel } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserGroupItem, useUserGroupList } from '../shared/api';
import { EmptyList } from '../shared/components';
import { HeaderTitleContext } from '../shared/context';
import { useInputFields } from '../shared/hooks';
import { AddUserGroup, EditUserGroup } from './components';
import { userGroupListColumns } from './helpers';

export const UserGroups: React.FC = () => {
  // Table States.
  const [paginationProps, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [pageCount, setPageCount] = useState(0);
  const [tableData, setTableData] = useState<UserGroupItem[]>([]);

  // States.
  const [showAddUserGroupSideCard, setShowAddUserGroupSideCard] =
    useState(false);
  const [showEditUserGroupSideCard, setShowEditUserGroupSideCard] = useState({
    id: '',
    show: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Contexts.
  const { setHeaderTitle, showSideCard } = useContext(HeaderTitleContext);

  // Hooks.
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { values, names, onChange, onBlur, onFocus, setValues } =
    useInputFields({
      searchInput: '',
    });

  const {
    data: userGroupListResponse,
    status,
    refetch: refetchUserGroupList,
    isLoading: isLoadingUserGroupList,
  } = useUserGroupList(true, {
    page: paginationProps.pageIndex,
    pageSize: paginationProps.pageSize,
    searchQuery,
  });

  // useEffects.
  useEffect(() => {
    setHeaderTitle('User Groups');
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchQuery(searchQuery);
      setValues({ searchInput: searchQuery });
    }
  }, []);

  useEffect(() => {
    if (!showSideCard.secondary) {
      setShowAddUserGroupSideCard(false);
      setShowEditUserGroupSideCard({ id: '', show: false });
    }
  }, [HeaderTitleContext, showSideCard]);

  useEffect(() => {
    searchQuery
      ? navigate({ search: '?search=' + searchQuery }, { replace: true })
      : navigate({ search: '' }, { replace: true });
  }, [searchQuery]);

  useEffect(() => {
    if (userGroupListResponse && status == 'success') {
      setTableData(userGroupListResponse.data.userGroups);
      setPageCount(
        Math.ceil(userGroupListResponse.data.total / paginationProps.pageSize),
      );
    }
  }, [userGroupListResponse, status]);

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPagination({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  // Handlers.
  const openAddUserGroupSideCard = () => {
    setShowAddUserGroupSideCard(true);
  };
  const closeAddUserGroupSideCard = () => {
    setShowAddUserGroupSideCard(false);
  };

  const openEditUserGroup = (id: string) => {
    setShowEditUserGroupSideCard({ id, show: true });
  };
  const closeEditUserGroupSideCard = () => {
    setShowEditUserGroupSideCard({ id: '', show: false });
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    setSearchQuery(values.searchInput);
  };

  const headerOptions = () => {
    return (
      <>
        <div className="user-group-list__header">
          <Input.Search
            className="user-group-list__header__search"
            name={names.searchInput}
            value={values.searchInput}
            onSubmit={onSearchSubmit}
            {...{ onChange, onBlur, onFocus }}
          />
        </div>
        <Button
          rightIconIdentifier={IconIdentifier.Plus}
          className="user-group-list__header__add-btn"
          onClick={openAddUserGroupSideCard}
        >
          Create User Group
        </Button>
      </>
    );
  };

  return (
    <>
      <div className="screen user-groups">
        {isEmpty(tableData) &&
        isEmpty(searchQuery) &&
        !isLoadingUserGroupList ? (
          <EmptyList
            headingText="You’ve not added any User Groups yet"
            addButton={
              <Button
                rightIconIdentifier={IconIdentifier.Plus}
                className="user-group-list__header__add-btn"
                onClick={openAddUserGroupSideCard}
              >
                Create User Group
              </Button>
            }
          />
        ) : (
          <Table
            columns={userGroupListColumns(openEditUserGroup)}
            data={tableData}
            getCoreRowModel={getCoreRowModel()}
            paginationProps={paginationProps}
            pageCount={pageCount}
            onPaginationChange={setPagination}
            onPageSizeChange={onPageSizeChange}
            tableHeaderOptions={headerOptions()}
            isLoading={isLoadingUserGroupList}
            isEmptySearchResults={isEmpty(tableData) && !isEmpty(searchQuery)}
          />
        )}
      </div>

      <AddUserGroup
        show={showAddUserGroupSideCard}
        closeAddUserGroup={closeAddUserGroupSideCard}
        refetchUserGroups={refetchUserGroupList}
      />
      <EditUserGroup
        userGroupId={showEditUserGroupSideCard.id}
        show={showEditUserGroupSideCard.show}
        closeEditUserGroup={closeEditUserGroupSideCard}
        refetchUserGroups={refetchUserGroupList}
      />
    </>
  );
};
