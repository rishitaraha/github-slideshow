import {
  FormMessage,
  FormMessageVariant,
  Input,
  InputSearchVariant,
  CheckBox,
  CheckboxAlignment,
} from '@aus-platform/design-system';
import { isEmpty, remove } from 'lodash';
import { FC, useState } from 'react';
import { isOrgAdmin } from '../../../../shared/helpers';
import { AccessTagProps } from '../../types';

export const AccessTags: FC<AccessTagProps> = ({
  accessTags,
  setAccessTags,
  loggedUser,
  values,
  setValues,
  accessTagListResponse,
}) => {
  const [accessTagSearchQuery, setAccessTagSearchQuery] = useState('');

  // Conditional variables.
  const showAccessTagInfo =
    !isOrgAdmin(loggedUser) && isEmpty(values.accessTags);

  // Handlers.
  const onAccessTagClick = (accessTagId: string) => {
    // Add access tag id in values if it is not present otherwise remove that tag form values.
    if (values.accessTags?.includes(accessTagId)) {
      const selectedAccessTags = remove(
        values.accessTags,
        (id) => id !== accessTagId,
      );
      setValues({ ...values, accessTags: selectedAccessTags });
    } else {
      setValues({
        ...values,
        accessTags: [...(values.accessTags ?? []), accessTagId],
      });
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
      {showAccessTagInfo && (
        <FormMessage
          message="Atleast 1 Access Tag should be selected"
          variant={FormMessageVariant.Info}
          className="layer-sidecard__access-tags__info-message"
        />
      )}
      <Input.Search
        placeholder="Search Access Tag"
        className="layer-sidecard__access-tags__search"
        variant={InputSearchVariant.NoButton}
        value={accessTagSearchQuery}
        onChange={onSearchInputChange}
      />
      <div className="layer-sidecard__access-tags__header">
        <h5>ACCESS TAGS {!isEmpty(accessTags) && `(${accessTags?.length})`}</h5>
        <h5>SELECT ({values.accessTags?.length})</h5>
      </div>
      <div
        className={`layer-sidecard__access-tags access-tag__input-group ${
          showAccessTagInfo && 'show_info'
        }`}
        data-testid="add-layer-sidecard-access-tags"
      >
        {accessTags.map(({ id, name }) => (
          <CheckBox
            key={id}
            title={name}
            checked={values.accessTags?.includes(id)}
            onClick={(event) => {
              event.stopPropagation();
              onAccessTagClick(id);
            }}
            alignCheckbox={CheckboxAlignment.Right}
          />
        ))}
      </div>
    </div>
  );
};
