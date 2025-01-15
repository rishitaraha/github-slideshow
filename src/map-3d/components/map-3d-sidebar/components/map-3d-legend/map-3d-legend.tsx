import { Spinner } from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { useAppSelector } from '../../../../../app/hooks';
import { Image } from '../../../../../assets/images';
import { useSite } from '../../../../../shared/api';
import { selectMap3dDataset } from '../../../../shared/map-3d-slices';

export const Map3DLegend = () => {
  // States.
  const [legendImage, setLegendImage] = useState<string>(Image.Legend);

  // Hooks.
  const { selectedTerrainSite } = useAppSelector(selectMap3dDataset);

  // Variables.
  const siteId = selectedTerrainSite?.id;

  // Api's.
  const {
    data: siteResponse,
    isSuccess,
    isLoading,
    refetch: refetchCurrentSite,
  } = useSite(false, {
    siteId: siteId ?? '',
  });

  // UseEffects.
  useEffect(() => {
    if (!isEmpty(siteId) && isNil(siteResponse)) {
      refetchCurrentSite();
    }
  }, [selectedTerrainSite]);

  useEffect(() => {
    if (
      !isNil(siteResponse) &&
      !isNil(siteResponse.data.legendImage) &&
      !isNil(siteResponse.data.legendImage?.downloadUrl)
    ) {
      setLegendImage(siteResponse.data.legendImage.downloadUrl);
    }
  }, [isSuccess]);

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="map-3d-legend-container">
          <img className="map-3d-legend__img" src={legendImage} />
        </div>
      )}
    </>
  );
};
