import React, { useEffect, useState } from 'react';
import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
  Input,
  SelectOption,
  toast,
} from '@aus-platform/design-system';
import { Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';

import {
  InputHorizontalCRSOptions,
  InputVerticalCRSOptions,
} from '../constants';
import { GeotagsSchemaModalProps } from './types';
import {
  defaultGeotagSchemaColumnsListGenerator,
  geotagsSchemaColumnOptionsListHelper,
  geotagsSchemaFieldsToSelectOptionsMapper,
  getUpdatedColumnsListForHCrs,
  rotationAnglesLabelFormatter,
  getUpdatedColumnForRotationType,
} from './helpers';
import {
  EPSGCode,
  GeotagSchemaField,
  HorizontalCRS,
  RotationAngleType,
} from 'src/shared/enums';
import {
  downloadGeotagImageRequest,
  queryClient,
  UploadGeotagDataPayload,
  useUploadGeotagImageFileRequest,
} from 'src/shared/api';
import { useInputFields } from 'src/shared/hooks';

export const GeotagsSchemaModal: React.FC<GeotagsSchemaModalProps> = ({
  geotagFileObject,
  iterationDataset,
  isUploadingGeotags = true,
  onClose,
}) => {
  // Constants.
  const rotationAnglesOptions: SelectOption<RotationAngleType>[] =
    Object.values(RotationAngleType).map((rotationAngleFields) => ({
      label: rotationAnglesLabelFormatter(rotationAngleFields),
      value: rotationAngleFields,
    }));

  const geotagRotationAngleType =
    iterationDataset?.rotationAngleType || RotationAngleType.OmegaPhiKappa;

  const allowedColumnFields = Object.values(GeotagSchemaField);

  const maxAllowedColumnFieldsCount =
    allowedColumnFields.length > 13 ? 13 : allowedColumnFields.length;

  // Conditional Constants.
  const initialGeotagSchemaColumnsListGenerator = (): GeotagSchemaField[] => {
    if (!isUploadingGeotags && iterationDataset.geotagColumnOrder) {
      return [
        GeotagSchemaField.Filename,
        ...iterationDataset.geotagColumnOrder.filter(
          (columnField) => columnField !== 'none',
        ),
      ];
    }
    if (iterationDataset && iterationDataset.geotagColumnOrder) {
      return [
        GeotagSchemaField.Filename,
        ...iterationDataset.geotagColumnOrder,
      ];
    }
    return defaultGeotagSchemaColumnsListGenerator(
      HorizontalCRS.WGS84,
      geotagRotationAngleType,
    );
  };

  const initialRotationAnglesOptionState: SelectOption<string> = {
    label: rotationAnglesLabelFormatter(geotagRotationAngleType),
    value: geotagRotationAngleType,
  };

  const initialHorizontalCrsOptionState: SelectOption<EPSGCode> =
    InputHorizontalCRSOptions.find(
      (obj) => obj.value == iterationDataset?.geotagHorizontalCrs,
    ) ?? InputHorizontalCRSOptions[0];

  const initialVerticalCrsOptionState: SelectOption =
    InputVerticalCRSOptions.find(
      (obj) => obj.value == iterationDataset?.geotagVerticalCrs,
    ) ?? InputVerticalCRSOptions[0];

  // States.
  const [isLoading, setIsLoading] = useState(false);

  const { values, names, setValues } = useInputFields({
    horizontalCrs: initialHorizontalCrsOptionState,
    verticalCrs: initialVerticalCrsOptionState,
    rotationAngles: initialRotationAnglesOptionState,
    columnOrder: initialGeotagSchemaColumnsListGenerator(),
  });

  // Api.
  const {
    mutate: uploadGeotagImageData,
    isSuccess: isSuccessCreateGeotagImageRequest,
    isError: isErrorCreateGeotagImageRequest,
    error: errorCreateGeotagImageRequest,
  } = useUploadGeotagImageFileRequest();

  // useEffects.
  useEffect(() => {
    if (isSuccessCreateGeotagImageRequest) {
      toast.success('Geotags uploaded successfully');
      onClose();
    }
    if (isErrorCreateGeotagImageRequest) {
      toast.error(errorCreateGeotagImageRequest.meta.message);
    }
    setIsLoading(false);
  }, [isSuccessCreateGeotagImageRequest, isErrorCreateGeotagImageRequest]);

  // Handlers.
  const onClickAddColumnHandler = () => {
    setValues({
      ...values,
      columnOrder: [...values.columnOrder, GeotagSchemaField.None],
    });
  };

  const onClickRemoveColumnHandler = (removedColumnIndex: number) => {
    let updatedColumnIndex = 0;
    const updatedColumnsList: GeotagSchemaField[] = [];
    values.columnOrder.map((columnField, currentColumnIndex) => {
      if (currentColumnIndex === removedColumnIndex) {
        return;
      }
      updatedColumnsList[updatedColumnIndex] = columnField;
      updatedColumnIndex++;
    });
    setValues({ ...values, columnOrder: [...updatedColumnsList] });
  };

  const onChangeColumnFieldHandler = (
    changedColumnIndex: number,
    selectedColumnOption: GeotagSchemaField,
  ) => {
    const updatedColumnsOrder = values.columnOrder.splice(0);
    updatedColumnsOrder[changedColumnIndex] = selectedColumnOption;
    setValues({ ...values, columnOrder: [...updatedColumnsOrder] });
  };

  const onSubmitGeotagsSchemaHandler = ({
    selectedColumnOrder,
    selectedRotationAngleType,
    horizontalCrs,
    verticalCrs,
  }) => {
    if (iterationDataset && geotagFileObject) {
      const requestPayload: UploadGeotagDataPayload = {
        iterationDataset: iterationDataset.id,
        geotagHorizontalCrs: horizontalCrs,
        geotagVerticalCrs: verticalCrs,
        geotagRotationAngle: selectedRotationAngleType,
        columnOrder: selectedColumnOrder,
        geotagImageFile: geotagFileObject,
      };
      uploadGeotagImageData(requestPayload);
    }
  };

  const onFormSubmit = async () => {
    if (isUploadingGeotags) {
      setIsLoading(true);

      // Upload.
      onSubmitGeotagsSchemaHandler({
        selectedRotationAngleType: values.rotationAngles.value,
        horizontalCrs: values.horizontalCrs.value,
        verticalCrs: values.verticalCrs.value,
        selectedColumnOrder: values.columnOrder,
      });
    } else {
      const response = await queryClient.fetchQuery({
        queryKey: [
          `/processing/geotag-images/download/`,
          iterationDataset.id,
          values.columnOrder,
        ],
        queryFn: () =>
          downloadGeotagImageRequest({
            iterationDataset: iterationDataset.id,
            geotagColumnOrder: values.columnOrder,
          }),
      });

      saveAs(response, iterationDataset.id + 'geotags.csv');
      queryClient.removeQueries({
        queryKey: [
          `/processing/geotag-images/download/`,
          iterationDataset.id,
          values.columnOrder,
        ],
      });
    }
  };

  // Render Handlers.
  const renderSchemaCrsAndRotationAnglesSelectors = () => {
    return (
      <div className="geotags-schema-modal__body__selectors-container">
        <div className="geotags-schema-modal__body__selectors">
          <div className="geotags-schema-modal__body__selectors-label">
            Horizontal CRS
          </div>
          <Input.Select
            className="geotags-schema-modal__body__selectors-dropdown"
            options={InputHorizontalCRSOptions}
            defaultValue={InputHorizontalCRSOptions[0]}
            value={values.horizontalCrs}
            name={names.horizontalCrs}
            isDisabled={!isUploadingGeotags}
            onChange={(selectedOption) => {
              const updatedColumns = getUpdatedColumnsListForHCrs(
                values,
                selectedOption.value,
              );
              setValues({
                ...values,
                columnOrder: updatedColumns,
                horizontalCrs: selectedOption,
              });
            }}
          />
        </div>

        <div className="geotags-schema-modal__body__selectors">
          <div className="geotags-schema-modal__body__selectors-label">
            Vertical CRS
          </div>
          <Input.Select
            className="geotags-schema-modal__body__selectors-dropdown"
            value={values.verticalCrs}
            name={names.verticalCrs}
            options={InputVerticalCRSOptions}
            defaultValue={InputVerticalCRSOptions[0]}
            isDisabled={!isUploadingGeotags}
            onChange={(selectedOption) => {
              setValues({
                ...values,
                verticalCrs: selectedOption,
              });
            }}
          />
        </div>

        <div className="geotags-schema-modal__body__selectors">
          <div className="geotags-schema-modal__body__selectors-label">
            Rotation Angles
          </div>
          <Input.Select
            className="geotags-schema-modal__body__selectors-dropdown"
            value={values.rotationAngles}
            name={names.rotationAngles}
            options={rotationAnglesOptions}
            defaultValue={rotationAnglesOptions[0]}
            isDisabled={!isUploadingGeotags}
            onChange={(selectedOption) => {
              const updatedColumns = getUpdatedColumnForRotationType(
                values,
                selectedOption.value,
              );
              setValues({
                ...values,
                columnOrder: updatedColumns,
                rotationAngles: selectedOption,
              });
            }}
          />
        </div>
      </div>
    );
  };

  const renderColumnsGrid = () => {
    const geotagsSchemaColumnOptionsList = geotagsSchemaColumnOptionsListHelper(
      {
        allowedColumnOptionsList: allowedColumnFields,
        selectedColumnOptionsList: values.columnOrder,
        selectedCrsSelectorOptions: values,
      },
    );

    const columnCell = (
      columnField: SelectOption<GeotagSchemaField | null>,
      columnIndex: number,
    ) => (
      <div
        key={`${columnField.value}_${columnIndex}`}
        className="geotags-schema-modal__body__columns-grid-cell"
      >
        <span className="geotags-schema-modal__body__columns-grid-cell-sno">
          {columnIndex + 1}.
        </span>

        <Input.Select
          value={columnField}
          options={geotagsSchemaFieldsToSelectOptionsMapper(
            geotagsSchemaColumnOptionsList,
            values.horizontalCrs.value,
          )}
          onChange={(selectedOption) =>
            onChangeColumnFieldHandler(columnIndex, selectedOption.value)
          }
          isDisabled={columnField.value === GeotagSchemaField.Filename}
        />

        <Button
          className="geotags-schema-modal__body__columns-grid-cell-remove-icon"
          leftIconIdentifier={IconIdentifier.CloseCircle}
          iconSize={15}
          variant={ButtonVariant.Secondary}
          onClick={() => onClickRemoveColumnHandler(columnIndex)}
          disabled={columnField.value === GeotagSchemaField.Filename}
        />
      </div>
    );

    return (
      <div className="geotags-schema-modal__body__columns-grid">
        {geotagsSchemaFieldsToSelectOptionsMapper(
          values.columnOrder,
          values.horizontalCrs.value,
        ).map(columnCell)}
      </div>
    );
  };

  return (
    <Modal
      className="geotags-schema-modal"
      show
      centered
      keyboard
      onHide={onClose}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>
        {isUploadingGeotags ? 'Import Geotags' : 'Export Geotags'}
        <Icon identifier={IconIdentifier.Cross} onClick={onClose} cursor />
      </Modal.Header>

      <Modal.Body className="geotags-schema-modal__body">
        <div className="geotags-schema-modal__body__header">
          Coordinate Reference System
        </div>

        {renderSchemaCrsAndRotationAnglesSelectors()}

        <Button
          className="geotags-schema-modal__body__add-column-button"
          variant={ButtonVariant.Outline}
          rightIconIdentifier={IconIdentifier.Plus}
          disabled={values.columnOrder.length >= maxAllowedColumnFieldsCount}
          onClick={onClickAddColumnHandler}
        >
          Add Column
        </Button>
        <div className="geotags-schema-modal__body__columns">
          <div className="geotags-schema-modal__body__header">Columns</div>
          {renderColumnsGrid()}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="geotags-schema-modal cancel-btn"
          variant={ButtonVariant.Secondary}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button isLoading={isLoading} onClick={onFormSubmit}>
          {isUploadingGeotags ? 'Import' : 'Export'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
