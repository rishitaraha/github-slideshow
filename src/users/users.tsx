import {
  Button,
  CheckBox,
  IconIdentifier,
  Input,
  InputGroup,
  Table,
} from '@aus-platform/design-system';
import { PaginationState, getCoreRowModel } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RequestStatus, User, useUserList } from '../shared/api';
import { EmptyList } from '../shared/components';
import { HeaderTitleContext } from '../shared/context';
import { useInputFields } from '../shared/hooks';
import { AddUser, EditUser } from './components';
import { UserListColumns } from './helpers';

export const Users: React.FC = () => {
  // States.
  const [paginationProps, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [pageCount, setPageCount] = useState(0);
  const [tableData, setTableData] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeactivatedUsers, setIsDeactivatedUsers] = useState(false);
  const [showAddUserSideCard, setShowAddUserSideCard] = useState(false);
  const [editUserSideCard, setEditUserSideCard] = useState({
    show: false,
    email: '',
  });

  // Contexts.
  const { setHeaderTitle } = useContext(HeaderTitleContext);
  const { showSideCard, setShowSideCard } = useContext(HeaderTitleContext);

  // Hooks.
  const [routeQueries] = useSearchParams();
  const navigate = useNavigate();
  const { values, names, onChange, onBlur, onFocus, setValues } =
    useInputFields({
      searchInput: '',
    });

  // Api.
  const {
    data: userList,
    status,
    refetch: refetchUserList,
    isLoading: isLoadingUserList,
  } = useUserList({
    page: paginationProps.pageIndex + 1,
    pageSize: paginationProps.pageSize,
    searchQuery,
    isDeactivatedUsers,
  });

  // useEffects.
  useEffect(() => {
    setHeaderTitle('Users');
  }, []);

  useEffect(() => {
    if (!showSideCard.secondary) {
      setEditUserSideCard({ show: false, email: '' });
      setShowAddUserSideCard(false);
    }
  }, [HeaderTitleContext, showSideCard]);

  useEffect(() => {
    if (userList && status === RequestStatus.Success) {
      setTableData(userList.data.users);
      setPageCount(Math.ceil(userList.data.total / paginationProps.pageSize));
    }
  }, [userList, status]);

  useEffect(() => {
    const searchQ = routeQueries.get('search');
    if (searchQ) {
      setSearchQuery(searchQ);
      setValues({ searchInput: searchQ });
    }
  }, []);

  useEffect(() => {
    searchQuery
      ? navigate({ search: '?search=' + searchQuery }, { replace: true })
      : navigate({ search: '' }, { replace: true });
  }, [searchQuery]);

  // Table Handlers.
  const onPageSizeChange = (option) => {
    setPagination({
      pageIndex: 0,
      pageSize: option.value,
    });
  };

  // Handlers.
  const setShowSideCardFunc = () => {
    setShowSideCard({ ...showSideCard, secondary: !showSideCard.secondary });
  };

  const openAddUserSideCard = () => {
    setShowAddUserSideCard(true);
    setShowSideCardFunc();
  };

  const closeAddUserSideCard = () => {
    setShowAddUserSideCard(false);
    setShowSideCardFunc();
  };

  const refetchUsers = () => refetchUserList();

  const onSearchSubmit = (event) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSearchQuery(values.searchInput);
  };

  const closeEditUserSideCard = () => {
    setEditUserSideCard({
      show: false,
      email: '',
    });
    setShowSideCardFunc();
  };

  const editUser = (email: string) => {
    setEditUserSideCard({ show: true, email: email });
    setShowSideCardFunc();
  };

  const getEmptyDeactivatedUsersList = (
    <EmptyList
      iconIdentifier={IconIdentifier.People}
      headingText="No deactivated users"
      bodyText="To deactivate, go to Users -> Edit -> Deactivate"
    />
  );

  const headerOptions = () => {
    return (
      <div className="user-list__header">
        <Input.Search
          className="user-list__header__search"
          name={names.searchInput}
          value={values.searchInput}
          onSubmit={onSearchSubmit}
          {...{ onChange, onBlur, onFocus }}
        />

        <InputGroup className="user-list__header__show-deactivated-user-toggle">
          <CheckBox
            checked={isDeactivatedUsers}
            title="Show Deactivated Users"
            showCard={false}
            onClick={() => setIsDeactivatedUsers((value) => !value)}
          />
        </InputGroup>
        {!isDeactivatedUsers && (
          <Button
            rightIconIdentifier={IconIdentifier.Plus}
            onClick={openAddUserSideCard}
            className="user-list__header__add-user-btn "
          >
            Add User
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="screen users">
        {!isDeactivatedUsers &&
        isEmpty(tableData) &&
        isEmpty(searchQuery) &&
        !isLoadingUserList ? (
          <EmptyList
            headingText="You’ve not added any Users yet"
            addButton={
              <Button
                rightIconIdentifier={IconIdentifier.Plus}
                onClick={openAddUserSideCard}
                className="user-list__header__add-user-btn "
              >
                Add User
              </Button>
            }
          />
        ) : (
          <Table
            columns={UserListColumns(editUser)}
            data={tableData}
            getCoreRowModel={getCoreRowModel()}
            paginationProps={paginationProps}
            pageCount={pageCount}
            onPaginationChange={setPagination}
            onPageSizeChange={onPageSizeChange}
            tableHeaderOptions={headerOptions()}
            isLoading={isLoadingUserList}
            isEmptySearchResults={isEmpty(tableData) && !isEmpty(searchQuery)}
            emptyListComponent={getEmptyDeactivatedUsersList}
          />
        )}
      </div>
      <AddUser
        show={showAddUserSideCard && showSideCard.secondary}
        closeAddUser={closeAddUserSideCard}
        refetchUsers={refetchUsers}
      />
      <EditUser
        show={editUserSideCard.show && showSideCard.secondary}
        closeEditUser={closeEditUserSideCard}
        email={editUserSideCard.email}
        refetchUsers={refetchUsers}
      />
    </>
  );
};
