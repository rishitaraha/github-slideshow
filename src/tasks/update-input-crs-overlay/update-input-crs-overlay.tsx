import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  ButtonVariant,
  ColorClass,
  IconIdentifier,
  Input,
  InputGroup,
  toast,
} from '@aus-platform/design-system';
import {
  EpsgCodeToTextCRSMapping,
  InputHorizontalCRSOptions,
  InputVerticalCRSOptions,
} from '../constants';
import { useIterationDatasetContext } from '../contexts/iteration-context';
import { SelectedCrsOption } from '../types';

import { useUpdateIterationDatasetRequest } from 'src/shared/api';

export const UpdateInputCrsModal: React.FC<{ isGcpCrs?: boolean }> = ({
  isGcpCrs = false,
}) => {
  // Context
  const { iterationDataset, refetchIterationDataset } =
    useIterationDatasetContext();

  const getInitialHorizontalCrsOption = () =>
    InputHorizontalCRSOptions.find(
      (option) => option.value === inputCrsData.horizontalCRS,
    ) ?? null;

  const getInitialVerticalCrsOption = () =>
    InputVerticalCRSOptions.find(
      (option) => option.value === inputCrsData.verticalCRS,
    ) ?? null;

  const getDatasetCurrentCrs = (dataset) => {
    return {
      horizontalCRS: isGcpCrs
        ? dataset.gcpHorizontalCrs
        : dataset.geotagHorizontalCrs,
      verticalCRS: isGcpCrs
        ? dataset.gcpVerticalCrs
        : dataset.geotagVerticalCrs,
    };
  };

  // States.
  const [showCRSOverlay, setShowCRSOverlay] = useState(false);
  const [inputCrsData, setInputCrsData] = useState(
    getDatasetCurrentCrs(iterationDataset),
  );
  const [inputCrsOption, setInputCrsOption] = useState<SelectedCrsOption>({
    horizontalCRS: getInitialHorizontalCrsOption(),
    verticalCRS: getInitialVerticalCrsOption(),
  });

  // useMemo.
  const isCRSSelected = useMemo(() => {
    return inputCrsOption.horizontalCRS && inputCrsOption.verticalCRS;
  }, [inputCrsOption]);

  // Hooks.
  const {
    data: updateCrsResponse,
    mutate: sendUpdateCrsRequest,
    isSuccess: isSuccessUpdateCRSRequest,
    isError: isErrorUpdateCRSRequest,
    isPending: isLoadingUpdateCRSRequest,
  } = useUpdateIterationDatasetRequest();

  const handleSaveInputCRS = () => {
    if (inputCrsOption.horizontalCRS && inputCrsOption.verticalCRS) {
      const selectedHorizontal = inputCrsOption.horizontalCRS.value;
      const updatePayload = {};
      if (isGcpCrs) {
        updatePayload['gcpHorizontalCrs'] = selectedHorizontal;
        updatePayload['gcpVerticalCrs'] = inputCrsOption.verticalCRS.value;
      } else {
        updatePayload['geotagHorizontalCrs'] = selectedHorizontal;
        updatePayload['geotagVerticalCrs'] = inputCrsOption.verticalCRS.value;
      }
      sendUpdateCrsRequest({
        iterationDatasetId: iterationDataset.id,
        ...updatePayload,
      });
    }
  };

  // useEffects.
  useEffect(() => {
    if (isSuccessUpdateCRSRequest) {
      const updatedIterationDataset = getDatasetCurrentCrs(
        updateCrsResponse.data.iterationDataset,
      );
      setInputCrsData(updatedIterationDataset);
      refetchIterationDataset();
      toast.success('Input CRS updated successfully.');
      setShowCRSOverlay(false);
    } else if (isErrorUpdateCRSRequest) {
      toast.error('Input CRS failed to update.');
    }
    return () => {};
  }, [isSuccessUpdateCRSRequest, isErrorUpdateCRSRequest, updateCrsResponse]);

  // Handlers.
  const handleHorizontalCrsChange = (e) => {
    setInputCrsOption((prev) => ({ ...prev, horizontalCRS: e }));
  };

  const handleVerticalCrsChange = (e) => {
    setInputCrsOption((prev) => ({ ...prev, verticalCRS: e }));
  };

  const toggleCRSOverlay = () => setShowCRSOverlay((prev) => !prev);

  const currentDatasetCRSText = useMemo(
    () => (
      <span className="text-truncate bd-highlight">
        {inputCrsData.horizontalCRS
          ? `${EpsgCodeToTextCRSMapping[inputCrsData.horizontalCRS]}, ${inputCrsData.verticalCRS}`
          : 'No CRS selected'}
      </span>
    ),
    [inputCrsData],
  );

  return (
    <>
      <Button
        className="geotag-images-modal-header__left-change-crs-btn"
        variant={ButtonVariant.Outline}
        onClick={toggleCRSOverlay}
        rightIconIdentifier={IconIdentifier.ChevronBigDown}
        color={ColorClass.Neutral300}
      >
        {currentDatasetCRSText}
      </Button>
      {showCRSOverlay && (
        <div className="crs-options-overlay card">
          <span className="input-crs-header">INPUT CRS</span>
          <InputGroup>
            <Input.Label>Horizontal CRS</Input.Label>
            <Input.Select
              placeholder="Select Horizontal CRS"
              options={InputHorizontalCRSOptions}
              value={inputCrsOption.horizontalCRS}
              onChange={handleHorizontalCrsChange}
            />
            <Input.Label>Vertical CRS</Input.Label>
            <Input.Select
              placeholder="Select Vertical CRS"
              options={InputVerticalCRSOptions}
              value={inputCrsOption.verticalCRS}
              onChange={handleVerticalCrsChange}
            />
          </InputGroup>
          <div className="crs-overlay-footer">
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleSaveInputCRS}
              disabled={!isCRSSelected || isLoadingUpdateCRSRequest}
            >
              Update
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={toggleCRSOverlay}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
