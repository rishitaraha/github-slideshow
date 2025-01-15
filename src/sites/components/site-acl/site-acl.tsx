import {
  Accordion,
  AccordionVariant,
  Input,
  InputSearchVariant,
  Spinner,
} from '@aus-platform/design-system';
import { size } from 'lodash';
import React, { Fragment, useState } from 'react';
import {
  SitePermissionPayload,
  useSitePermissionRequest,
} from '../../../shared/api';
import { SiteACLUserGroupsList } from './site-acl-user-groups-list';
import { CheckboxStatusParams, SiteACLProps, SiteUserGroupList } from './types';

// acl = Access Control list.
export const SiteACL: React.FC<SiteACLProps> = ({
  userGroups,
  siteId,
  isLoading,
  totalUserGroups,
  selectedUserGroupsCount = 0,
}) => {
  // States.
  const [userGroupList, setUserGroupList] =
    useState<SiteUserGroupList>(userGroups);
  const [searchInput, setSearchInput] = useState('');
  const [searchResultCount, setSearchResultCount] = useState(size(userGroups));
  const [selectCount, setSelectCount] = useState(selectedUserGroupsCount);

  // Hooks.
  const { mutate: sendSitePermissionRequest } = useSitePermissionRequest();

  // Handlers.
  const setCheckboxStatus = ({
    groupId,
    newStatus,
    accessType,
    canView,
    canManageIterationsAndLayers,
    sendRequest = true,
  }: CheckboxStatusParams) => {
    if (sendRequest) {
      sendSitePermission({
        id: siteId,
        userGroupId: groupId,
        accessType: accessType,
        canView,
        canManageIterationsAndLayers,
      });
    }

    const prevCanView = userGroupList[groupId].canView;
    const prevCanManageIterationsAndLayers =
      userGroupList[groupId].canManageIterationsAndLayers;

    // From unchecked to checked.
    if (
      !(prevCanView || prevCanManageIterationsAndLayers) &&
      (canView || canManageIterationsAndLayers)
    ) {
      setSelectCount(selectCount + 1);
    } else if (
      // Vice-versa of the condition above.
      (prevCanView || prevCanManageIterationsAndLayers) &&
      !(canView || canManageIterationsAndLayers)
    ) {
      setSelectCount(selectCount - 1);
    }

    setUserGroupList({
      ...userGroupList,
      [groupId]: {
        ...userGroupList[groupId],
        canView: canView,
        canManageIterationsAndLayers: canManageIterationsAndLayers,
        checkboxStatus: newStatus,
      },
    });
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

  const sendSitePermission = (group: SitePermissionPayload) => {
    sendSitePermissionRequest(group);
  };

  // Renders.
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="site-acl">
      <div className="site-acl__search">
        <Input.Search
          placeholder={'Search User Groups and select to give them access'}
          variant={InputSearchVariant.NoButton}
          value={searchInput}
          onChange={(e) => onSearchHandler(e.currentTarget.value)}
        />
      </div>
      <div className="site-acl__user-group-list">
        <div className="site-acl__user-group-list-header">
          <div className="site-acl__user-group-list-header__item-1">
            USER GROUPS ({totalUserGroups})
          </div>
          <div className="site-acl__user-group-list-header__item-2">
            SELECT ({selectCount})
          </div>
        </div>
        <div className="site-acl__user-group-list-body">
          {searchResultCount > 0 ? (
            <Accordion alwaysOpen variant={AccordionVariant.ChevronLeft}>
              {Object.entries(userGroupList).map(
                ([groupId, group], key: number) => {
                  return (
                    <Fragment key={key}>
                      {group.show && (
                        <SiteACLUserGroupsList
                          uniqueKey={key}
                          groupId={groupId}
                          group={group}
                          setCheckboxStatus={setCheckboxStatus}
                        />
                      )}
                    </Fragment>
                  );
                },
              )}
            </Accordion>
          ) : (
            <span className="site-acl__span">
              No search result found for this keyword.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
