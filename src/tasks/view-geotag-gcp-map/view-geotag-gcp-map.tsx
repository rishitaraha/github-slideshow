import { Spinner } from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useEffect, useMemo, useRef } from 'react';
import {
  Map,
  addGeotagPointsToMapHandler,
  createMapComponentProps,
} from '../map';
import { ViewGeotagGcpMapProps } from './types';
import {
  useGCPList,
  useInfiniteGetGeotagImageListRequest,
} from 'src/shared/api';

export const ViewGeotagGcpMapPreview = ({
  dataset,
  showGeotagImageActionButton,
  showGCPActionButton,
  onClickGeotagImagePoint,
  onClickGCPImagePoint,
}: ViewGeotagGcpMapProps) => {
  const pageSize = 5000;
  // Ref to track already processed geotag pages.
  const lastProcessedGeotagPageIndex = useRef<number>(0);

  const {
    data: geotagImagesData,
    fetchNextPage: fetchNextGeotagPage,
    hasNextPage: hasNextGeotagPage,
  } = useInfiniteGetGeotagImageListRequest({
    iterationDataset: dataset.id,
    pageSize,
  });

  const { data: gcpsData } = useGCPList({
    iterationDataset: dataset.id,
    pageSize,
  });

  const canLoad = geotagImagesData && gcpsData;

  const mapComponentProps = useMemo(() => {
    if (canLoad) {
      const geotagImageDetails = {
        items: geotagImagesData.pages[0].data.geotagImages.filter(
          (gi) => !isNil(gi.locationWgs84),
        ),
        showActionButton: showGeotagImageActionButton,
        onClick: onClickGeotagImagePoint,
      };

      const gcpDetails = {
        items: gcpsData.data.gcps.filter((gcp) => !isNil(gcp.locationWgs84)),
        showActionButton: showGCPActionButton,
        onClick: onClickGCPImagePoint,
      };

      return createMapComponentProps({
        dataset,
        geotagImageDetails,
        gcpDetails,
        dsmMetadata: undefined,
        orthoMetadata: undefined,
      });
    }
    return null; // Return null if data is not available.
  }, [canLoad]);

  useEffect(() => {
    if (canLoad && mapComponentProps) {
      // Handle geotagimage pagination.
      geotagImagesData.pages.forEach((page, index) => {
        if (index > lastProcessedGeotagPageIndex.current) {
          addPointsToMap(
            page.data.geotagImages.filter((gi) => !isNil(gi.locationWgs84)),
            mapComponentProps,
          );
          lastProcessedGeotagPageIndex.current = index;
        }
      });

      if (hasNextGeotagPage) {
        fetchNextGeotagPage();
      }
    }
  }, [canLoad, mapComponentProps, geotagImagesData]);

  const addPointsToMap = (points, mapProps) => {
    const geotagImageDetails = {
      items: points,
      showActionButton: showGeotagImageActionButton,
      onClick: onClickGeotagImagePoint,
    };
    addGeotagPointsToMapHandler(geotagImageDetails, mapProps);
  };

  if (!mapComponentProps) {
    return <Spinner />;
  }

  return <Map {...{ viewLayers: mapComponentProps.viewLayers }} />;
};
