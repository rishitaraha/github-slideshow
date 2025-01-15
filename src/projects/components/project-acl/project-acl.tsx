import {
  Accordion,
  AccordionCheckBoxStatus,
  AccordionVariant,
  Input,
  InputSearchVariant,
  Spinner,
  SwitchCard,
} from '@aus-platform/design-system';
import { size } from 'lodash';
import React, { useState } from 'react';
import {
  ProjectPermissionPayload,
  useProjectPermissionRequest,
} from '../../../shared/api';
import {
  ProjectACLProps,
  ProjectUserGroup,
  ProjectUserGroupList,
} from './type';

// acl = Access list.
export const ProjectACL: React.FC<ProjectACLProps> = ({
  userGroups,
  projectId,
  isLoading,
  totalUserGroups,
  selectedUserGroupsCount = 0,
}) => {
  // States.
  const [userGroupList, setUserGroupList] =
    useState<ProjectUserGroupList>(userGroups);
  const [searchInput, setSearchInput] = useState('');
  const [searchResultCount, setSearchResultCount] = useState(size(userGroups));
  const [selectCount, setSelectCount] = useState(selectedUserGroupsCount);

  // Hooks.
  const { mutate: sendProjectPermissionRequest } =
    useProjectPermissionRequest();

  // Handlers.
  const setCheckboxStatus = (
    groupId: string,
    newStatus: AccordionCheckBoxStatus,
    canView: boolean,
    canManageSites: boolean,
  ) => {
    sendProjectPermission({
      id: projectId,
      userGroupId: groupId,
      canView,
      canManageSites,
    });

    const prevCanView = userGroupList[groupId].canView;
    const prevCanManageSite = userGroupList[groupId].canManageSites;

    // From unchecked to checked.
    if (!(prevCanView || prevCanManageSite) && (canView || canManageSites)) {
      setSelectCount(selectCount + 1);
    } else if (
      // Vice-versa of the condition above.
      (prevCanView || prevCanManageSite) &&
      !(canView || canManageSites)
    ) {
      setSelectCount(selectCount - 1);
    }

    setUserGroupList({
      ...userGroupList,
      [groupId]: {
        ...userGroupList[groupId],
        canView: canView,
        canManageSites: canManageSites,
        checkboxStatus: newStatus,
      },
    });
  };

  const onCheckBoxClick = (groupId: string, userGroup: ProjectUserGroup) => {
    if (
      userGroup.checkboxStatus === AccordionCheckBoxStatus.Checked ||
      userGroup.checkboxStatus === AccordionCheckBoxStatus.Indeterminate
    ) {
      setCheckboxStatus(
        groupId,
        AccordionCheckBoxStatus.Unchecked,
        false,
        false,
      );
    } else {
      setCheckboxStatus(groupId, AccordionCheckBoxStatus.Checked, true, true);
    }
  };

  const onToggle = (groupId: string, userGroup: ProjectUserGroup) => {
    const { canView, canManageSites } = userGroup;
    if (!canView && !canManageSites) {
      setCheckboxStatus(
        groupId,
        AccordionCheckBoxStatus.Unchecked,
        canView,
        canManageSites,
      );
    } else if (canView && !canManageSites) {
      setCheckboxStatus(
        groupId,
        AccordionCheckBoxStatus.Indeterminate,
        canView,
        canManageSites,
      );
    } else {
      setCheckboxStatus(
        groupId,
        AccordionCheckBoxStatus.Checked,
        canView,
        canManageSites,
      );
    }
  };

  const onSearchHandler = (input: string) => {
    const searchResult = userGroupList;
    let resultCount = 0;
    Object.entries(searchResult).map((group) => {
      const [, currentGroup] = group;
      if (currentGroup.name.toLowerCase().includes(input.toLowerCase())) {
        currentGroup.show = true;
        resultCount++;
      } else {
        currentGroup.show = false;
      }
    });
    setSearchResultCount(resultCount);
    setUserGroupList(searchResult);
    setSearchInput(input);
  };

  const sendProjectPermission = (group: ProjectPermissionPayload) => {
    sendProjectPermissionRequest(group);
  };

  // Renders.
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="project-acl">
      <div className="project-acl__search">
        <Input.Search
          placeholder={'Search User Groups and select to give them access'}
          variant={InputSearchVariant.NoButton}
          value={searchInput}
          onChange={(e) => onSearchHandler(e.currentTarget.value)}
        />
      </div>
      <div className="project-acl__user-group-list">
        <div className="project-acl__user-group-list-header">
          <div className="project-acl__user-group-list-header__item-1">
            USER GROUPS ({totalUserGroups})
          </div>
          <div className="project-acl__user-group-list-header__item-2">
            SELECT ({selectCount})
          </div>
        </div>
        <div className="project-acl__user-group-list-body">
          {searchResultCount > 0 ? (
            <Accordion alwaysOpen variant={AccordionVariant.ChevronLeft}>
              {Object.entries(userGroupList).map(
                ([groupId, group], key: number) => {
                  return (
                    group.show && (
                      <Accordion.ItemWithCheckBox
                        title={group.name}
                        checkBoxStatus={group.checkboxStatus}
                        eventKey={key.toString()}
                        onCheckBoxClick={() => onCheckBoxClick(groupId, group)}
                        key={key}
                      >
                        <SwitchCard
                          title={'View Project'}
                          dataTestId="view-project-checkbox-id"
                          checked={group.canView}
                          onClick={() =>
                            onToggle(groupId, {
                              ...group,
                              canView: !group.canView,
                              canManageSites: !group.canView
                                ? group.canManageSites
                                : !group.canView,
                            })
                          }
                        />
                        <SwitchCard
                          title={'Manage Sites'}
                          dataTestId="manage-sites-checkbox-id"
                          checked={group.canManageSites}
                          onClick={() =>
                            onToggle(groupId, {
                              ...group,
                              canView: group.canManageSites
                                ? group.canView
                                : !group.canManageSites,
                              canManageSites: !group.canManageSites,
                            })
                          }
                        />
                      </Accordion.ItemWithCheckBox>
                    )
                  );
                },
              )}
            </Accordion>
          ) : (
            <span className="project-acl__span">
              No search result found for this keyword.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
