import {
  ColorCodes,
  Fab,
  IconIdentifier,
  Input,
  Placement,
  toast,
  Tooltip,
} from '@aus-platform/design-system';
import { isUndefined } from 'lodash';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { MapTool } from '../enums';
import { parseAndValidateCoordinates } from './helpers';
import { LocationSearchInput } from './types';
import {
  selectMap3DState,
  setCurrentActiveMapTool,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';
import { IPointTool, PointTool } from 'src/map-3d/shared';
import { ValidationError } from 'src/shared/errors';

const searchObjInitialState: LocationSearchInput = {
  value: '',
  isInvalid: false,
};

export const SearchBar: React.FC = () => {
  // Refs.
  const pointTool = useRef<IPointTool>();

  // Sates.
  const [isExpanded, setIsExpanded] = useState(false);

  // Selectors.
  const { cesiumProxy, currentActiveMapTool } =
    useAppSelector(selectMap3DState);

  // Dispatchers.
  const dispatch = useAppDispatch();

  // States.
  const [searchObj, setSearchObj] = useState<LocationSearchInput>(
    searchObjInitialState,
  );

  // useEffects.
  useEffect(() => {
    if (cesiumProxy?.cesiumViewer && isUndefined(pointTool.current)) {
      pointTool.current = new PointTool(cesiumProxy.cesiumViewer);
    }

    return () => {
      pointTool.current?.destroy();
      pointTool.current = undefined;
    };
  }, [cesiumProxy?.cesiumViewer]);

  useEffect(() => {
    if (currentActiveMapTool !== MapTool.SearchTool) {
      clearSearch();
    }
  }, [currentActiveMapTool]);

  // Handlers.
  const onClickSearchBarButton = () => {
    if (isExpanded) {
      clearSearch();
      dispatch(setCurrentActiveMapTool(MapTool.None));
    } else {
      setIsExpanded(true);
      dispatch(setCurrentActiveMapTool(MapTool.SearchTool));
    }
  };

  const onChangeSearchInput = (event: FormEvent<HTMLInputElement>) => {
    setSearchObj({
      ...searchObj,
      value: event.currentTarget.value,
      isInvalid: false,
    });
  };

  const onSubmitSearchInput = () => {
    try {
      const { longitude, latitude } = parseAndValidateCoordinates(
        searchObj.value,
      );
      addPointWithStyle(longitude, latitude);

      cesiumProxy?.flyTo({
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        height: 5000,
      });
    } catch (error) {
      setSearchObj({ ...searchObj, isInvalid: true });
      if (error instanceof ValidationError) {
        toast.error(error.message);
      } else if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  const onKeyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        onSubmitSearchInput();
        break;
      case 'Escape':
        clearSearch();
        break;

      default:
        break;
    }
  };

  // Helpers.
  const clearSearch = () => {
    setIsExpanded(false);
    setSearchObj(searchObjInitialState);
    pointTool.current?.deleteAllPoints();
  };

  const addPointWithStyle = (longitude: number, latitude: number) => {
    const point = pointTool.current?.addPoint(longitude, latitude);
    point?.updateStyle({
      pointStyleOptions: {
        color: '#CA4139',
        strokeColor: ColorCodes.White,
        strokeWidth: 1.4,
      },
    });
  };

  return (
    <div className="search-bar">
      <Tooltip hoverText="Search Coordinates" placement={Placement.Right}>
        <Fab
          leftIconIdentifier={IconIdentifier.Search}
          onClick={onClickSearchBarButton}
          dataTestId="map-tools-search-bar-icon-btn"
          active={isExpanded}
        />
      </Tooltip>
      {isExpanded && (
        <Input.Search
          className="search-bar__search-input"
          placeholder="Enter coordinates (lat,long)&#176;"
          value={searchObj.value}
          onChange={onChangeSearchInput}
          onKeyDown={onKeyDownHandler}
          onSubmit={() => onSubmitSearchInput()}
          dataTestId="map-tools-search-bar-input"
          isInvalid={searchObj.isInvalid}
        />
      )}
    </div>
  );
};
