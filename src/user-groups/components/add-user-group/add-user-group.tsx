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
import { UserGroupACL } from '..';
import {
  handleFormInputMessage,
  useAccessTagList,
  useAddUserGroup,
  useUserList,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { userGroupTabs } from '../../constants';
import { UserCheckBoxInput, UserGroupAccessTagsList } from '../../types';
import { userGroupValidator } from '../../user-groups-validators';
import { AddUserGroupInput, AddUserGroupProps } from './types';

const addUserGroupInputState: AddUserGroupInput = {
  name: '',
  searchQuery: '',
  users: [],
  selectedUsersCount: 0,
};

export const AddUserGroup: React.FC<AddUserGroupProps> = ({
  show,
  closeAddUserGroup,
  refetchUserGroups,
}) => {
  // States.
  const [activeTabKey, setActiveTabKey] = useState(userGroupTabs.Basic);
  const [accessTagsList, setAccessTagsList] = useState<UserGroupAccessTagsList>(
    {},
  );
  const [allUsersCount, setAllUsersCount] = useState(0);
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
    inputIsDirty,
    resetAll,
  } = useInputFields<AddUserGroupInput>(
    addUserGroupInputState,
    userGroupValidator,
  );

  // Api's.
  const {
    data: usersListResponse,
    isSuccess,
    isLoading: userListIsLoading,
  } = useUserList({
    membersOnly: true,
    isDeactivatedUsers: false,
  });

  const {
    mutate: sendAddUserGroupRequest,
    data: addUserGroupResponse,
    isError: isErrorAddUserGroup,
    isPending: isLoadingAddUserGroup,
    isSuccess: isSuccessAddUserGroup,
    error: errorOnAddUserGroup,
  } = useAddUserGroup();

  const {
    data: accessTagsListResponse,
    isLoading: isLoadingAccessTag,
    isSuccess: isSuccessAccessTag,
  } = useAccessTagList();

  const setInitialUsersList = () => {
    return usersListResponse?.data.users.map((user) => ({
      id: user.id,
      name: user.firstName + ' ' + user.lastName,
      checked: false,
      show: true,
    }));
  };

  // UseEffects.

  useEffect(() => {
    if (isSuccessAddUserGroup && addUserGroupResponse) {
      refetchUserGroups();
      onCloseSidecard();
      resetAll();
    } else {
      handleFormInputMessage(
        isSuccessAddUserGroup,
        isErrorAddUserGroup,
        addUserGroupResponse,
        errorOnAddUserGroup,
        setErrors,
        setFormError,
      );
    }
  }, [isSuccessAddUserGroup, isErrorAddUserGroup]);

  useEffect(() => {
    if (usersListResponse && isSuccess) {
      setAllUsersCount(usersListResponse?.data.total || 0);
      setValues({ ...values, users: setInitialUsersList() });
    }
  }, [usersListResponse, isSuccess]);

  useEffect(() => {
    if (accessTagsListResponse && isSuccessAccessTag) {
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
      setAccessTagsList(accessTags);
    }
  }, [accessTagsListResponse, isSuccessAccessTag]);

  // Handlers.
  const onCloseSidecard = () => {
    closeAddUserGroup();
    setFormError('');
    setAllUsersCount(usersListResponse?.data.total || 0);
    setValues({
      ...addUserGroupInputState,
      users: setInitialUsersList(),
    });
    setActiveTabKey(userGroupTabs.Basic);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (values.users) {
      sendAddUserGroupRequest({
        name: values.name,
        users: values.users.flatMap((user) => (user.checked ? [user.id] : [])),
        accessTags: Object.entries(accessTagsList).flatMap(([id, data]) =>
          data.isChecked ? [id] : [],
        ),
      });
      setActiveTabKey(userGroupTabs.Basic);
    }
  };

  const onCheckUserHandler = (userArg: UserCheckBoxInput, index: number) => {
    let updatedSelectUsersCount = values.selectedUsersCount;
    if (userArg.checked) {
      updatedSelectUsersCount -= 1;
    } else {
      updatedSelectUsersCount += 1;
    }

    if (values.users) {
      const updatedUser = [...values.users];

      updatedUser[index].checked = !userArg.checked;

      setValues((values) => ({
        ...structuredClone(values),
        users: updatedUser,
        selectedUsersCount: updatedSelectUsersCount,
      }));
    }
  };

  const searchHandler = (event) => {
    const searchQuery = event.target.value.toLowerCase();
    if (isEmpty(searchQuery)) {
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
    if (!inputHasError() && inputIsDirty()) {
      setActiveTabKey(tabKey);
    }
  };

  // Renders.
  const renderAddUserGroup = () => {
    return userListIsLoading ? (
      <Spinner />
    ) : (
      <form className="add-user-group__container" onSubmit={onSubmit}>
        {/* Group Name */}
        <div className="add-user-group__name-container">
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
        <InputGroup>
          {/* Users Search*/}
          <Input.Search
            placeholder="Search Users"
            className="add-user-group__search"
            value={values.searchQuery}
            name={names.searchQuery}
            onChange={searchHandler}
            variant={InputSearchVariant.NoButton}
          />
        </InputGroup>

        {/* Users */}
        <InputGroup className="add-user-group__input-label__for-users">
          <Input.Label>USERS ({allUsersCount})</Input.Label>
          <Input.Label>SELECT ({values.selectedUsersCount})</Input.Label>
        </InputGroup>

        <div className="overflow-auto add-user-group__list">
          {values.users?.map((user, index) => {
            return (
              user.show && (
                <div
                  className="add-user-group__checkbox-container"
                  key={user.id}
                >
                  <CheckBox
                    onClick={() => onCheckUserHandler(user, index)}
                    title={user.name}
                    checked={user.checked}
                    alignCheckbox={CheckboxAlignment.Right}
                  />
                </div>
              )
            );
          })}
        </div>
      </form>
    );
  };

  return (
    <SideCard
      showCloseButton
      title="Add User Group"
      placement={SideCardLocation.End}
      onClose={onCloseSidecard}
      show={show}
      formError={formError}
      className="add-user-group"
      footer={
        <div className="add-user-group__btn-container">
          <Button
            variant={ButtonVariant.Secondary}
            onClick={onCloseSidecard}
            className="add-user-group__btn-container__cancel-btn"
          >
            Cancel
          </Button>
          {activeTabKey !== userGroupTabs.Basic ? (
            <Button
              type="submit"
              isLoading={isLoadingAddUserGroup}
              onClick={onSubmit}
              disabled={isEmpty(values.name) || !isEmpty(errors.name)}
            >
              Create User Group
            </Button>
          ) : (
            <Button
              onClick={() => setActiveTabKey(userGroupTabs.AccessTags)}
              disabled={isEmpty(values.name) || !isEmpty(errors.name)}
            >
              Next
            </Button>
          )}
        </div>
      }
    >
      <TabSwitcher
        tabComponentList={[
          {
            label: userGroupTabs.Basic,
            children: renderAddUserGroup(),
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
