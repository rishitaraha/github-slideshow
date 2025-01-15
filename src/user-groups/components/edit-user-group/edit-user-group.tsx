import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  InputSearchVariant,
  SideCard,
  SideCardLocation,
  Spinner,
  TabSwitcher,
  CheckBox,
  CheckboxAlignment,
} from '@aus-platform/design-system';

import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  handleFormInputMessage,
  useAccessTagList,
  useDeleteUserGroup,
  useEditUserGroup,
  useUserGroup,
  useUserList,
} from '../../../shared/api';
import { ConfirmationModal } from '../../../shared/components';
import { useInputFields } from '../../../shared/hooks';
import { userGroupTabs } from '../../constants';
import { UserCheckBoxInput, UserGroupAccessTagsList } from '../../types';
import { userGroupValidator } from '../../user-groups-validators';
import { UserGroupACL } from '../user-group-acl';
import { EditUserGroupInput, EditUserGroupProps } from './types';

const editUserGroupInputState: EditUserGroupInput = {
  name: '',
  searchQuery: '',
  users: [],
};

export const EditUserGroup: React.FC<EditUserGroupProps> = ({
  show,
  userGroupId,
  closeEditUserGroup,
  refetchUserGroups,
}) => {
  // States.
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [selectedUsersCount, setSelectedUsersCount] = useState(0);
  const [activeTabKey, setActiveTabKey] = useState(userGroupTabs.Basic);
  const [showDeleteConfirmationCard, setShowDeleteConfirmationCard] =
    useState(false);
  const [accessTagsList, setAccessTagsList] = useState<UserGroupAccessTagsList>(
    {},
  );
  const [formError, setFormError] = useState<string>('');

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    setErrors,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    resetAll,
  } = useInputFields<EditUserGroupInput>(
    editUserGroupInputState,
    userGroupValidator,
  );

  const setInitialUsersList = () => {
    const userIds = new Set(userGroupResponse?.data.users);
    return userListResponse?.data.users.map((user) => ({
      id: user.id,
      name: user.firstName + ' ' + user.lastName,
      checked: userIds.has(user.id),
      show: true,
    }));
  };

  // Api's
  const {
    data: userListResponse,
    isSuccess: isSuccessUsersList,
    isLoading: isLoadingUsersList,
    refetch: refetchUsers,
  } = useUserList({
    membersOnly: true,
    isDeactivatedUsers: false,
  });

  const {
    data: userGroupResponse,
    isSuccess: isSuccessUserGroup,
    isLoading: isLoadingUserGroup,
  } = useUserGroup(userGroupId, !isEmpty(userGroupId));

  const {
    mutate: sendEditUserGroupRequest,
    data: editUserData,
    isError,
    isSuccess,
    error,
  } = useEditUserGroup(userGroupId);

  const {
    mutate: sendDeleteUserGroupRequest,
    data: deletedUserGroupResponse,
    isError: isErrorOnDelete,
    isSuccess: isSuccessDeleteUserGroup,
    error: deleteError,
  } = useDeleteUserGroup(userGroupId);

  const {
    data: accessTagsListResponse,
    isLoading: isLoadingAccessTag,
    isSuccess: isSuccessAccessTag,
  } = useAccessTagList();

  // UseEffects.
  useEffect(() => {
    if (
      isSuccessUserGroup &&
      isSuccessUsersList &&
      userGroupResponse &&
      userListResponse &&
      isSuccessAccessTag &&
      accessTagsListResponse
    ) {
      setValues({
        ...values,
        name: userGroupResponse.data.name,
        users: setInitialUsersList(),
      });

      setSelectedUsersCount(userGroupResponse.data.users?.length || 0);

      const accessTags = accessTagsListResponse.data.list.reduce(
        (previousAccessTags, currentTag) => {
          return {
            ...previousAccessTags,
            [currentTag.id]: {
              name: currentTag.name,
              isChecked: false,
            },
          };
        },
        {},
      );
      userGroupResponse.data.accessTags.map(
        (accessTagId) => (accessTags[accessTagId].isChecked = true),
      );
      setAccessTagsList(accessTags);
    }
  }, [
    isSuccessUserGroup,
    isSuccessUsersList,
    userGroupResponse,
    userListResponse,
    isSuccessAccessTag,
    accessTagsListResponse,
  ]);

  useEffect(() => {
    if (isSuccess && editUserData) {
      onCloseSidecard();
      resetAll();
      setValues(editUserGroupInputState);
    } else {
      handleFormInputMessage(
        isSuccess,
        isError,
        editUserData,
        error,
        setErrors,
        setFormError,
      );
    }
  }, [isSuccess, isError]);

  useEffect(() => {
    if (isSuccessDeleteUserGroup) {
      onCloseSidecard();
      handleFormInputMessage(
        isSuccessDeleteUserGroup,
        isErrorOnDelete,
        deletedUserGroupResponse,
        deleteError,
        setErrors,
        setFormError,
      );
    }
  }, [isSuccessDeleteUserGroup, deletedUserGroupResponse]);

  // Handlers.
  const showDeleteUserGroupConfirmation = () => {
    setShowDeleteConfirmationCard(true);
    setIsDeleteDisabled(true);
  };

  const closeDeleteUserGroupConfirmation = () => {
    setShowDeleteConfirmationCard(false);
    setIsDeleteDisabled(false);
  };

  const onCloseSidecard = () => {
    closeDeleteUserGroupConfirmation();
    closeEditUserGroup();
    refetchUserGroups();
    setFormError('');
    refetchUsers();
    resetAll();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (values.users) {
      sendEditUserGroupRequest({
        name: values.name,
        users: values.users.flatMap((user) => (user.checked ? [user.id] : [])),
        accessTags: Object.entries(accessTagsList).flatMap(([id, data]) =>
          data.isChecked ? [id] : [],
        ),
      });
      setActiveTabKey(userGroupTabs.Basic);
    }
  };

  const onDeleteUserGroup = () => {
    sendDeleteUserGroupRequest();
    closeDeleteUserGroupConfirmation();
  };

  const onSelectUserHandler = (user: UserCheckBoxInput, index: number) => {
    if (user.checked) {
      setSelectedUsersCount(selectedUsersCount - 1);
    } else {
      setSelectedUsersCount(selectedUsersCount + 1);
    }
    if (values.users) {
      const updatedUser = [...values.users];
      updatedUser[index].checked = !user.checked;
      setValues({
        ...values,
        users: updatedUser,
      });
    }
  };

  const searchHandler = (event) => {
    const searchQuery = event.target.value.toLowerCase();
    if (searchQuery === '') {
      values.users = values.users?.map((user) => ({ ...user, show: true }));
    } else {
      values.users = values.users?.map((user) => {
        if (user.name.toLowerCase().includes(searchQuery)) {
          return { ...user, show: true };
        } else {
          return { ...user, show: false };
        }
      });
    }
    onChange(event);
  };

  const onTabSwitchHandler = (tabKey) => {
    // Validation check on tab switch.
    if (!inputHasError()) {
      setActiveTabKey(tabKey);
    }
  };

  // Renders.
  const renderEditUserGroup = () => {
    return (
      <>
        {showDeleteConfirmationCard && (
          <ConfirmationModal
            title="Delete User Group"
            message={'Are you sure you want to delete the User Group?'}
            onSubmit={onDeleteUserGroup}
            onClose={closeDeleteUserGroupConfirmation}
            cancelText={'Cancel'}
            confirmText={'Delete'}
            isConfirmDanger
          />
        )}
        {isLoadingUsersList || isLoadingUserGroup ? (
          <Spinner />
        ) : (
          <form className="edit-user-group-form" onSubmit={onSubmit}>
            <div className="edit-user-group-form__name-container">
              {/* Group Name */}
              <InputGroup>
                <Input.Label>Group Name</Input.Label>
                <Input.Text
                  placeholder="Group Name"
                  value={values.name}
                  required={true}
                  name={names.name}
                  error={errors.name}
                  isInvalid={!!errors.name}
                  {...{ onChange, onBlur, onFocus }}
                />
                <hr className="br-line" />
              </InputGroup>
            </div>
            {/* Users Search */}
            <InputGroup>
              <Input.Search
                className="edit-user-group-form__search-box"
                placeholder="Search Users"
                value={values.searchQuery}
                name={names.searchQuery}
                onChange={searchHandler}
                variant={InputSearchVariant.NoButton}
              />
            </InputGroup>

            {/* Users */}
            <InputGroup className="edit-user-group__input-label__for-users">
              <Input.Label>USERS ({userListResponse?.data.total})</Input.Label>
              <Input.Label>SELECT ({selectedUsersCount})</Input.Label>
            </InputGroup>

            <div className="overflow-auto edit-user-group-form__users">
              {values.users?.map((user, index) => {
                return (
                  user.show && (
                    <div
                      key={user.id}
                      className="edit-user-group-form__checkbox-card"
                    >
                      <CheckBox
                        className="edit-user-group-form__checkbox"
                        onClick={() => onSelectUserHandler(user, index)}
                        checked={user.checked}
                        title={user.name}
                        alignCheckbox={CheckboxAlignment.Right}
                        {...{ onChange }}
                      />
                    </div>
                  )
                );
              })}
            </div>
          </form>
        )}
      </>
    );
  };

  return (
    <SideCard
      showCloseButton
      title="Edit User Group"
      placement={SideCardLocation.End}
      onClose={onCloseSidecard}
      formError={formError}
      show={show}
      className="edit-user-group"
      footer={
        <div className="edit-user-group-form__btn-container">
          <div>
            <Button
              onClick={showDeleteUserGroupConfirmation}
              disabled={isDeleteDisabled || isLoadingUserGroup}
              variant={ButtonVariant.Danger}
            >
              Delete
            </Button>
          </div>
          <div className="edit-user-group-form__btn-container__update-btns">
            <Button
              variant={ButtonVariant.Secondary}
              onClick={onCloseSidecard}
              className="edit-user-group-form__btn-container__cancel-btn"
            >
              Cancel
            </Button>
            {activeTabKey === userGroupTabs.Basic ? (
              <Button
                onClick={() => setActiveTabKey(userGroupTabs.AccessTags)}
                disabled={isLoadingUserGroup}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={onSubmit}
                disabled={isLoadingUserGroup}
              >
                Update
              </Button>
            )}
          </div>
        </div>
      }
    >
      <TabSwitcher
        className="edit-user-group__tabs-switcher"
        tabComponentList={[
          {
            label: userGroupTabs.Basic,
            children: renderEditUserGroup(),
            key: userGroupTabs.Basic,
          },
          {
            label: userGroupTabs.AccessTags,
            children: (
              <UserGroupACL
                accessTagsList={accessTagsList}
                setAccessTagsList={setAccessTagsList}
                totalAccessTags={accessTagsListResponse?.data.total || 0}
                isLoadingAccessTag={isLoadingAccessTag}
                selectedAccessTags={
                  userGroupResponse?.data.accessTags.length || 0
                }
              />
            ),
            key: userGroupTabs.AccessTags,
          },
        ]}
        activeKey={activeTabKey}
        onTabSwitch={(tabKey) => onTabSwitchHandler(tabKey)}
      />
    </SideCard>
  );
};
