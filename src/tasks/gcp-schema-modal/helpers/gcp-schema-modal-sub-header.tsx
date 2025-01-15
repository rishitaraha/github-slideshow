import {
  Button,
  ButtonVariant,
  ColorClass,
  IconIdentifier,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import { FC } from 'react';
import { GCPSchemaModalSubHeaderProps } from '../types';
import { useInputFields } from 'shared/hooks';
import { UpdateInputCrsModal } from 'src/tasks/update-input-crs-overlay';

export const GCPSchemaModalSubHeader: FC<GCPSchemaModalSubHeaderProps> = ({
  rowSelection,
  searchGCPState,
  downloadGCPData,
  displayMapView,
  displayGCPUploadModal,
  displayDeleteConfirmationModal,
}) => {
  // variables.
  const { setSearchGCP } = searchGCPState;
  const { values, names, onChange, onBlur, onFocus } = useInputFields({
    searchInput: '',
  });

  // Handler.
  const onSearchSubmit = (event) => {
    event.preventDefault();
    setSearchGCP(values.searchInput);
  };

  return (
    <InputGroup className="gcp-schema-modal__sub-header">
      <div className="gcp-schema-modal__sub-header--left">
        <UpdateInputCrsModal isGcpCrs={true} />
        <Input.Search
          onSubmit={onSearchSubmit}
          name={names.searchInput}
          value={values.searchInput}
          {...{ onChange, onBlur, onFocus }}
        />
      </div>
      <div className="gcp-schema-modal__sub-header--right">
        {!isEmpty(rowSelection) && (
          <Button
            variant={ButtonVariant.Danger}
            onClick={displayDeleteConfirmationModal}
            leftIconIdentifier={IconIdentifier.Bin}
            color={ColorClass.Red500}
            iconSize={18}
          />
        )}
        <Button
          variant={ButtonVariant.Outline}
          onClick={displayMapView}
          leftIconIdentifier={IconIdentifier.Map}
          iconSize={14}
        >
          Map
        </Button>
        <Button
          variant={ButtonVariant.Outline}
          onClick={displayGCPUploadModal}
          leftIconIdentifier={IconIdentifier.Geotag}
          iconSize={14}
        >
          Upload
        </Button>
        <Button
          variant={ButtonVariant.Outline}
          onClick={downloadGCPData}
          leftIconIdentifier={IconIdentifier.Download}
          iconSize={14}
        >
          Download
        </Button>
      </div>
    </InputGroup>
  );
};
