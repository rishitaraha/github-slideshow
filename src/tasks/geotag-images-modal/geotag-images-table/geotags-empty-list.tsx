import { useMemo } from 'react';
import { isEmpty } from 'lodash';
import { IconIdentifier } from '@aus-platform/design-system';
import { useGeotagImagesContext } from '../../contexts';
import { EmptyList } from 'src/shared/components';

export const EmptyGeotagsList: React.FC = () => {
  // Contexts.
  const { iterationDataset, geotagImagePayload, searchText } =
    useGeotagImagesContext();

  const headingText = useMemo(() => {
    const searchSuffix = 'No results found for ';
    if (!isEmpty(searchText)) {
      return `${searchSuffix} "${searchText}"`;
    } else if (geotagImagePayload.imagesWithGeotags) {
      return searchSuffix + '"Images with Geotags"';
    } else if (geotagImagePayload.imagesWithoutGeotags) {
      return searchSuffix + '"Images without Geotags"';
    } else if (geotagImagePayload.geotagsWithoutImages) {
      return searchSuffix + '"Geotags without Images"';
    } else {
      return 'No Geotag Images present';
    }
  }, [geotagImagePayload, searchText]);

  return (
    <EmptyList
      headingText={headingText}
      iconIdentifier={
        !iterationDataset.areGeotagsPresent
          ? IconIdentifier.GeotagNotPresent
          : IconIdentifier.Search
      }
      bodyText={
        iterationDataset.areGeotagsPresent
          ? `We couldn't find what you were looking for`
          : ''
      }
    />
  );
};
