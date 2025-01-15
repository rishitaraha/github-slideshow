import {
  Input,
  InputSearchVariant,
  CheckBox,
  CheckboxAlignment,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import { FC, useState } from 'react';
import { isOrgAdmin } from '../../../../../shared/helpers';
import { EditLayerAccessTag } from './types';

export const AccessTags: FC<EditLayerAccessTag> = ({
  accessTags,
  setAccessTags,
  dirty,
  setDirty,
  loggedUser,
  values,
  setValues,
  accessTagListResponse,
}) => {
  const [accessTagSearchQuery, setAccessTagSearchQuery] = useState('');

  const onAccessTagClick = (accessTagId: string) => {
    // Add access tag id in values if it is not present otherwise remove that tag form values.
    if (
      isOrgAdmin(loggedUser) ||
      (!isOrgAdmin(loggedUser) &&
        ((values.accessTags && values.accessTags.length > 1) ||
          !values.accessTags?.includes(accessTagId)))
    ) {
      // Dirty will enable for access tag when clicked on checkbox.
      if (!dirty.accessTags) {
        setDirty({
          ...dirty,
          accessTags: true,
        });
      }
      if (values.accessTags?.includes(accessTagId)) {
        const selectedAccessTags = values.accessTags.filter(
          (id) => accessTagId !== id,
        );
        setValues({ ...values, accessTags: selectedAccessTags });
      } else {
        setValues({
          ...values,
          accessTags: [...(values.accessTags ?? []), accessTagId],
        });
      }
    }
  };

  const onSearchInputChange = (event) => {
    const query = event.target.value.toLowerCase();
    setAccessTagSearchQuery(query);
    if (accessTagListResponse) {
      setAccessTags(
        accessTagListResponse.list.filter(({ name }) =>
          name.toLowerCase().includes(query),
        ),
      );
    }
  };

  return (
    <div className="layer-sidecard__access-tags-container">
      <Input.Search
        placeholder="Search Access Tag"
        className="layer-sidecard__access-tags__search"
        variant={InputSearchVariant.NoButton}
        value={accessTagSearchQuery}
        onChange={onSearchInputChange}
      />
      <div className="layer-sidecard__access-tags__header">
        <h5>ACCESS TAGS {!isEmpty(accessTags) && `(${accessTags?.length})`}</h5>
        <h5>
          SELECT
          {!isEmpty(values.accessTags) && `(${values.accessTags?.length})`}
        </h5>
      </div>
      <div
        className="layer-sidecard__access-tags access-tag__input-group"
        data-testid="edit-layer-sidecard-access-tags"
      >
        {accessTags.map(({ id, name }, index) => (
          <CheckBox
            key={index}
            title={name}
            className={
              !isOrgAdmin(loggedUser) &&
              values.accessTags?.includes(id) &&
              values.accessTags.length <= 1
                ? 'disable-checkbox'
                : ''
            }
            checked={values.accessTags?.includes(id)}
            onClick={() => onAccessTagClick(id)}
            alignCheckbox={CheckboxAlignment.Right}
          />
        ))}
      </div>
    </div>
  );
};
