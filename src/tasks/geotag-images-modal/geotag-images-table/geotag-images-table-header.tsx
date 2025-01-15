import {
  Button,
  ButtonVariant,
  ColorClass,
  IconIdentifier,
  Input,
  InputSearchVariant,
} from '@aus-platform/design-system';
import React, { useState } from 'react';
import { useGeotagImagesContext } from '../../contexts';
import { FilterOptionsOverlay } from '../filter-options-overlay';
import { GeotagImagesModalView } from '../enum';
import { UpdateInputCrsModal } from 'src/tasks/update-input-crs-overlay';
import {
  GeotagsModalUploadPreview,
  GeotagsSchemaModal,
} from 'src/tasks/upload-geotags-modal';

export const GeotagImagesTableHeader: React.FC = () => {
  // Contexts.
  const {
    geotagImagePayload,
    setGeotagImagePayload,
    onUploadImages,
    displayUploadGeotagsFile,
    setShowToggleGeotagImagesModal,
    showDeleteGeotagsModal,
    refetchGeotagImages,
    rowSelection,
    iterationDataset,
    searchText,
    setSearchText,
    setModalPageView,
  } = useGeotagImagesContext();

  // States.
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [showGeotagsSchemaModal, setShowGeotagsSchemaModal] = useState(false);
  const [showGeotagsUploadModal, setShowGeotagsUploadModal] = useState(false);

  // Constants.
  const geotagImagesSelected = Object.keys(rowSelection).length > 0;

  // Handlers.
  const toggleFilterOverlay = () => setShowFilterOverlay((prev) => !prev);

  const displayGeotagsSchemaModal = () => setShowGeotagsSchemaModal(true);
  const hideGeotagsSchemaModal = () => setShowGeotagsSchemaModal(false);

  const hideGeotagsUploadModal = () => {
    refetchGeotagImages();
    setShowGeotagsUploadModal(false);
  };

  const onSearchType = (e) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (filterValue) => {
    setGeotagImagePayload((prevState) => ({
      ...prevState,
      [filterValue]: !prevState[filterValue],
    }));
  };

  const handleSearchSubmit = () => {
    setGeotagImagePayload((prevState) => ({
      ...prevState,
      search: searchText,
    }));
  };

  return (
    <div className="geotag-images-modal-header">
      <div className="geotag-images-modal-header__left">
        <UpdateInputCrsModal />
        <Button
          iconSize={14}
          variant={ButtonVariant.Outline}
          onClick={toggleFilterOverlay}
          leftIconIdentifier={IconIdentifier.Filter}
        >
          Filter
        </Button>
        {showFilterOverlay && (
          <FilterOptionsOverlay
            onCheckChange={handleFilterChange}
            checkedOptions={{
              imagesWithGeotags: geotagImagePayload.imagesWithGeotags ?? false,
              imagesWithoutGeotags:
                geotagImagePayload.imagesWithoutGeotags ?? false,
              geotagsWithoutImages:
                geotagImagePayload.geotagsWithoutImages ?? false,
            }}
          />
        )}

        <Input.Search
          placeholder="Search Geotag Images"
          variant={InputSearchVariant.Button}
          value={searchText}
          onChange={onSearchType}
          onSubmit={handleSearchSubmit}
        />
      </div>

      <div className="geotag-images-modal-header__right">
        {geotagImagesSelected && (
          <Button
            variant={ButtonVariant.Danger}
            onClick={showDeleteGeotagsModal}
            leftIconIdentifier={IconIdentifier.Bin}
            color={ColorClass.Red500}
            iconSize={18}
          />
        )}
        {geotagImagesSelected && (
          <Button
            variant={ButtonVariant.Outline}
            onClick={() => {
              setShowToggleGeotagImagesModal(true);
            }}
            leftIconIdentifier={IconIdentifier.Gears}
            iconSize={18}
          >
            Toggle Images / Geotags
          </Button>
        )}

        <Button
          variant={ButtonVariant.Outline}
          onClick={() => setModalPageView(GeotagImagesModalView.Map)}
          leftIconIdentifier={IconIdentifier.Map}
          iconSize={14}
          hidden={!iterationDataset.areGeotagsPresent}
        >
          Map
        </Button>

        <Button
          variant={ButtonVariant.Outline}
          onClick={displayGeotagsSchemaModal}
          leftIconIdentifier={IconIdentifier.GeotagDownload}
          iconSize={14}
          hidden={!iterationDataset.areGeotagsPresent}
        >
          Download
        </Button>

        <Button
          variant={ButtonVariant.Outline}
          onClick={onUploadImages}
          leftIconIdentifier={IconIdentifier.CloudUpload}
          iconSize={14}
        >
          Add Images
        </Button>

        <Button
          variant={ButtonVariant.Outline}
          onClick={displayUploadGeotagsFile}
          leftIconIdentifier={IconIdentifier.Geotag}
          iconSize={14}
        >
          Upload Geotags
        </Button>
      </div>
      {showGeotagsSchemaModal && iterationDataset && (
        <GeotagsSchemaModal
          iterationDataset={iterationDataset}
          isUploadingGeotags={false}
          onClose={hideGeotagsSchemaModal}
        />
      )}
      {showGeotagsUploadModal && (
        <GeotagsModalUploadPreview onClose={hideGeotagsUploadModal} />
      )}
    </div>
  );
};
