import {
  ColorCodes,
  Icon,
  IconButton,
  IconIdentifier,
  Input,
  SelectOption,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isNil } from 'lodash';
import { Map, View } from 'ol';
import { defaults } from 'ol/interaction/defaults';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useProjectList, useSiteList } from '../shared/api';
import { useInputFields } from '../shared/hooks';
import {
  Coordinate,
  getBaseLayer,
  panAndZoomCameraView,
  resetZoomAndCoordinate,
  zoomIn,
  zoomOut,
} from '../shared/resources/openlayers';
import { ComponentRoute, ShowSideCardsState } from '../shared/types';
import { SwipeMapBaseLayer, SwipeMapLayers, SwipeMapTools } from './components';
import { SwipeMapInput } from './types';

const initialSwipeMapInputState: SwipeMapInput = {
  project: null,
  site: null,
};

export const SwipeMap: React.FC & ComponentRoute = () => {
  // Refs.
  const mapRef = useRef() as React.MutableRefObject<HTMLDivElement>;
  const swipeRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  // States.
  const [map, setMap] = useState<Map>();
  const [swipeValue, setSwipeValue] = useState(50);
  const [dragStarted, setDragStarted] = useState(false);
  const [projects, setProjects] = useState<SelectOption[]>();
  const [sites, setSites] = useState<SelectOption[]>();
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const { values, setValues, onBlur, onFocus } = useInputFields<SwipeMapInput>(
    initialSwipeMapInputState,
  );
  const [siteCoordinates, setSiteCoordinates] = useState<Coordinate>({
    longitude: 0,
    latitude: 0,
  });
  const [isLeftSideCardExpanded, setIsLeftSideCardExpanded] = useState(false);
  const [isSatelliteLayerVisible, setIsSatelliteLayerVisible] = useState(true);
  const baseLayer = useMemo(() => getBaseLayer(), []);
  const [isRightSideCardExpanded, setIsRightSideCardExpanded] = useState(false);
  const [showSideCard, setShowSideCard] = useState<ShowSideCardsState>({
    left: true,
    right: true,
  });

  // Hooks.
  const {
    data: projectsResponse,
    isLoading: projectsIsLoading,
    isSuccess: projectsIsSuccess,
  } = useProjectList();

  const {
    data: sitesResponse,
    isLoading: sitesIsLoading,
    isSuccess: sitesIsSuccess,
  } = useSiteList(
    {
      projectId: values.project?.value ?? '',
      searchQuery: siteSearchQuery,
      excludeFields: ['canManageIterationsAndLayers'],
    },
    !!values.project,
  );

  // useEffects.
  useEffect(() => {
    const initialMapView = new View({
      zoom: 2.1,
      maxZoom: 25,
      minZoom: 3,
      center: [0, 0],
    });

    // TODO: Remove this hack and investigate map resolution problem.
    setTimeout(() => {
      // Ref: https://stackoverflow.com/a/56363890.
      const mapObject = new Map({
        interactions: defaults({
          onFocusOnly: false,
        }),
        layers: [baseLayer],
        target: mapRef.current,
        view: initialMapView,
      });
      setMap(mapObject);
      mapRef.current.style.backgroundColor = ColorCodes.MapBackground;
    }, 100);
  }, [baseLayer]);

  useEffect(() => {
    if (projectsResponse && projectsIsSuccess) {
      setProjects(
        projectsResponse.data.projects.map((project) => {
          return { label: project.name, value: project.id };
        }),
      );
    }
  }, [projectsResponse, projectsIsSuccess]);

  useEffect(() => {
    if (sitesResponse && sitesIsSuccess) {
      setSites(
        sitesResponse.list.map((site) => {
          return { label: site.name, value: site.id };
        }),
      );
    }
  }, [sitesResponse, sitesIsSuccess]);

  // Constants.
  const swipeMapControlsCustomClass = classNames([
    'swipe-map__controls',
    isRightSideCardExpanded ? 'expanded' : '',
  ]);

  // Handlers.
  const renderMap = () => map?.render();

  const onDragStart = () => setDragStarted(true);

  const onDragStop = () => setDragStarted(false);

  const updateSwipeValue = (e) => {
    if (dragStarted) {
      setSwipeValue((e.clientX / mapRef.current.offsetWidth) * 100);
      const event = new Event('input', { bubbles: true });

      swipeRef.current.dispatchEvent(event);
    }
  };

  const onProjectChange = (selectedProject: SelectOption) => {
    setValues({ ...initialSwipeMapInputState, project: selectedProject });
    setIsRightSideCardExpanded(false);
    setIsLeftSideCardExpanded(false);
  };

  const onSiteChange = (selectedSite: SelectOption) => {
    setValues({
      ...values,
      site: selectedSite,
    });
    const siteData = sitesResponse?.list.filter(
      (item) => item.id == selectedSite.value,
    )[0];

    if (siteData?.latitude && siteData?.longitude && !isNil(map)) {
      panAndZoomCameraView(map, {
        latitude: siteData.latitude,
        longitude: siteData.longitude,
      });
      setSiteCoordinates({
        latitude: siteData.latitude,
        longitude: siteData.longitude,
      });
    }
  };

  const toggleSatelliteView = () => {
    setIsSatelliteLayerVisible(!isSatelliteLayerVisible);
    baseLayer.setVisible(!isSatelliteLayerVisible);
  };

  return (
    <div className="swipe-map">
      {/* Swipe Map Header */}
      <div className="swipe-map__header">
        <Input.Select
          className="swipe-map__header__input"
          placeholder="Select Project"
          options={projects}
          value={values.project}
          isLoading={projectsIsLoading}
          onChange={onProjectChange}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 999 }),
          }}
          {...{ onBlur, onFocus }}
        />
        <Input.Select
          className="swipe-map__header__input"
          placeholder="Select Site"
          options={sites}
          onInputChange={(searchQuery) => setSiteSearchQuery(searchQuery)}
          value={values.site}
          isLoading={sitesIsLoading}
          isDisabled={!values.project}
          onChange={onSiteChange}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 999 }),
          }}
          {...{ onBlur, onFocus }}
        />
      </div>

      {/* Map and Swipe Bar */}
      <div
        ref={mapRef}
        className="swipe-map__ol-map"
        tabIndex={-1}
        onMouseUp={onDragStop}
        onMouseMove={updateSwipeValue}
      >
        <span
          className="swipe-map__ol-map__swipe-bar"
          style={{ left: `${swipeValue}%` }}
          onMouseDown={onDragStart}
        >
          <Icon
            identifier={IconIdentifier.SwipeMapSlider}
            className="swipe-map__ol-map__swipe-bar__icon"
            size={29}
          />
        </span>
        <input
          type="range"
          ref={swipeRef}
          className="swipe-map__ol-map__swipe-bar__input"
          value={swipeValue}
          onInput={renderMap}
        />
      </div>

      {/* Map Zoom Controls */}
      {!isNil(map) && (
        <div className={swipeMapControlsCustomClass}>
          <IconButton
            iconIdentifier={IconIdentifier.Plus}
            onClick={() => zoomIn(map)}
          />
          <IconButton
            iconIdentifier={IconIdentifier.Reset}
            onClick={() => resetZoomAndCoordinate(map, siteCoordinates)}
            disabled={!values.site}
          />
          <IconButton
            iconIdentifier={IconIdentifier.Minus}
            onClick={() => zoomOut(map)}
          />
        </div>
      )}

      {/* Layers */}
      {!isNil(map) && values.site && (
        <SwipeMapLayers
          siteId={values.site.value}
          map={map}
          swipeRef={swipeRef}
          setIsLeftSideCardExpanded={setIsLeftSideCardExpanded}
          setIsRightSideCardExpanded={setIsRightSideCardExpanded}
          onCloseSideCard={() => {
            mapRef.current.focus();
          }}
          showSideCard={showSideCard}
          setShowSideCard={setShowSideCard}
        />
      )}

      {!isNil(map) && (
        <SwipeMapTools
          map={map}
          mapRef={mapRef}
          isLeftSideCardExpanded={isLeftSideCardExpanded}
        />
      )}

      {!isNil(map) && (
        <SwipeMapBaseLayer
          baseLayer={baseLayer}
          isSatelliteLayerVisible={isSatelliteLayerVisible}
          toggleSatelliteView={toggleSatelliteView}
          isLeftSideCardExpanded={isLeftSideCardExpanded}
        />
      )}
    </div>
  );
};

SwipeMap.route = '/swipe-map';
