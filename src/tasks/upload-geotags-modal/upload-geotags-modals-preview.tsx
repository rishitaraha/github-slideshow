import { useState } from 'react';
import { ActiveGeotagImageUploadHandlerModal } from '../enums';
import { useIterationDatasetContext } from '../contexts';
import { GeotagsSchemaModal } from './geotags-schema-modal';
import { GeotagsUploadModal } from './upload-geotags-modal';
import { GeotagsModalUploadPreviewProps } from './types';

export const GeotagsModalUploadPreview = ({
  onClose,
}: GeotagsModalUploadPreviewProps) => {
  // COntexts.
  const { iterationDataset, refetchIterationDataset } =
    useIterationDatasetContext();

  // States.
  const [geotagFileObject, setGeotagFileObject] = useState<File | null>(null);
  const [activeModal, setActiveModal] =
    useState<ActiveGeotagImageUploadHandlerModal>(
      ActiveGeotagImageUploadHandlerModal.FileSelector,
    );

  const openSchemaSelector = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (geotagFileObject) {
      setActiveModal(ActiveGeotagImageUploadHandlerModal.SchemaSelector);
    }
  };

  const closeModals = () => {
    setGeotagFileObject(null);
    refetchIterationDataset();
    onClose();
  };

  const closeSchemaModal = () => {
    setGeotagFileObject(null);
    refetchIterationDataset();
    onClose();
  };

  return (
    <>
      {activeModal === ActiveGeotagImageUploadHandlerModal.FileSelector && (
        <GeotagsUploadModal
          acceptedFileFormat=".txt, .csv"
          geotagFileObject={geotagFileObject}
          setGeotagFileObject={setGeotagFileObject}
          onSubmit={openSchemaSelector}
          onClose={closeModals}
        />
      )}
      {activeModal === ActiveGeotagImageUploadHandlerModal.SchemaSelector &&
        iterationDataset && (
          <GeotagsSchemaModal
            {...{ iterationDataset, geotagFileObject }}
            onClose={closeSchemaModal}
          />
        )}
    </>
  );
};
