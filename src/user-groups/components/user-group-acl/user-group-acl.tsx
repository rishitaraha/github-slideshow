import {
  Input,
  InputSearchVariant,
  Spinner,
  CheckboxAlignment,
  CheckBox,
  InputGroup,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import React, { useState } from 'react';
import { UserGroupAccessTag } from '../../types';
import { UserGroupACLProps } from './types';

export const UserGroupACL: React.FC<UserGroupACLProps> = ({
  accessTagsList,
  setAccessTagsList,
  totalAccessTags,
  isLoadingAccessTag,
  selectedAccessTags = 0,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [accessTagsSelectCount, setAccessTagsSelectCount] =
    useState(selectedAccessTags);

  // Handlers.
  const onClickCheckBox = (groupId: string, group: UserGroupAccessTag) => {
    if (!group.isChecked) {
      setAccessTagsSelectCount(accessTagsSelectCount + 1);
    } else {
      setAccessTagsSelectCount(accessTagsSelectCount - 1);
    }
    setAccessTagsList({
      ...accessTagsList,
      [groupId]: { ...group, isChecked: !group.isChecked },
    });
  };

  // Renders
  const renderAccessTagList = () => {
    const list = Object.entries(accessTagsList).filter(([, group]) =>
      group.name.toLowerCase().includes(searchInput.toLowerCase()),
    );

    if (isEmpty(list)) {
      return (
        <span className="user-group-acl__span">
          No search result found for this keyword.
        </span>
      );
    }

    return (
      <>
        {list.map(([groupId, group], key: number) => (
          <CheckBox
            title={group.name}
            checked={group.isChecked}
            onClick={() => onClickCheckBox(groupId, group)}
            key={key}
            alignCheckbox={CheckboxAlignment.Right}
          />
        ))}
      </>
    );
  };

  return isLoadingAccessTag ? (
    <Spinner />
  ) : (
    <div className="user-group-acl">
      <InputGroup className="user-group-acl__search">
        <Input.Search
          placeholder={'Search User Groups and select to give them access'}
          variant={InputSearchVariant.NoButton}
          value={searchInput}
          onChange={(e) => setSearchInput(e.currentTarget.value)}
        />
      </InputGroup>
      <div className="user-group-acl__user-group-list">
        <InputGroup className="user-group-acl__user-group-list-header">
          <div className="user-group-acl__user-group-list-header__item-1">
            ACCESS TAGS ({totalAccessTags})
          </div>
          <div className="user-group-acl__user-group-list-header__item-2">
            SELECT ({accessTagsSelectCount})
          </div>
        </InputGroup>
      </div>
      <div className="user-group-acl__user-group-list-body">
        {renderAccessTagList()}
      </div>
    </div>
  );
};
