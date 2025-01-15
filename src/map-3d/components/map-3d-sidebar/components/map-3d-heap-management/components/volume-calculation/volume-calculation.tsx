import {
  Button,
  ButtonVariant,
  FormMessage,
  IconIdentifier,
  Input,
  InputGroup,
  RadioToggleGroup,
  SelectOption,
  StatusIndicatorLevel,
  ToggleSwitch,
  toast,
} from '@aus-platform/design-system';
import { isEmpty, isNil, isUndefined, xor } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { WorkspaceLayer, WorkspaceLayerListObj } from '../../../../shared';
import {
  heapCategoryOptions,
  heapMaterialOptions,
  heapTabs,
} from '../../constants';
import { baseReferenceOptions, heapInitialState } from './constants';
import { FormErrorMessages, HeapMarkArea } from './enums';
import { HeapInputFieldType, VolumeCalculationPropsType } from './types';
import { volumeCalculationValidator } from './volume-calculation-validator';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { MapTool } from 'map-3d/components/map-3d-container/map-3d-tools';
import { UnsavedFeaturesModal } from 'map-3d/components/map-3d-sidebar/components/map-3d-workspace/modals';
import {
  selectActiveWorkspaceLayersByFeatureType,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dHeap,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
  setCurrentEditableLayerId,
  setShowUnsavedFeaturesModal,
} from 'map-3d/shared/map-3d-slices';
import { PolygonEventType } from 'map-3d/shared/map-3d-tools';
import {
  BaseReference,
  FeatureGeometryType,
  FeatureResponseData,
  FeatureType,
  IterationListItem,
  handleResponseErrorMessage,
  handleResponseMessage,
  useAddHeap,
  useFeatureList,
  useIterationsList,
  useSite,
} from 'shared/api';
import { FileStatus } from 'shared/enums';
import { Formatter } from 'shared/helpers';
import { useInputFields } from 'shared/hooks';
import { setVectorLayerVisibility } from 'src/map-3d/components';

export const VolumeCalculation: React.FC<VolumeCalculationPropsType> = ({
  heapListRefetch,
  onSelectHeapHandler,
  setActiveTabKey,
}) => {
  // States.
  const [iterationList, setIterationList] =
    useState<SelectOption<IterationListItem | null>[]>();
  const [isDrawPolygonToolEnabled, setIsDrawPolygonToolEnabled] =
    useState(false);
  const [isResetDrawingEnabled, setIsResetDrawingEnabled] = useState(false);
  const [currentMarkedArea, setCurrentMarkedArea] = useState<HeapMarkArea>(
    HeapMarkArea.Draw,
  );

  // Hooks.
  const {
    values,
    setValues,
    names,
    errors,
    setErrors,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    optional,
    setOptional,
    getOptionalFields,
  } = useInputFields<HeapInputFieldType>(
    heapInitialState,
    volumeCalculationValidator,
  );
  const dispatch = useAppDispatch();

  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { selectedTerrainIteration, selectedTerrainSite } =
    useAppSelector(selectMap3dDataset);
  const { polygonTool } = useAppSelector(selectMap3dHeap);
  const { showUnsavedFeaturesModal, workspaceLayers } =
    useAppSelector(selectMap3dWorkspace);

  const activeLayers = useAppSelector((state) =>
    selectActiveWorkspaceLayersByFeatureType(
      state,
      FeatureGeometryType.Polygon,
    ),
  );

  const polygonLayersSelectOption: SelectOption<WorkspaceLayer>[] =
    activeLayers.map((activeLayer) => ({
      label: activeLayer.name,
      value: activeLayer,
    }));

  // useMemo.
  const visibleWorkspaceLayers: WorkspaceLayerListObj = useMemo(
    () =>
      Object.keys(workspaceLayers).reduce(
        (toggledOnLayersListObject, layerId) => {
          if (workspaceLayers[layerId].show) {
            toggledOnLayersListObject[layerId] = workspaceLayers[layerId];
            return toggledOnLayersListObject;
          }
          return toggledOnLayersListObject;
        },
        {},
      ),
    [workspaceLayers],
  );

  // Api.
  const {
    mutate: sendAddHeapBoundaryRequest,
    isPending: isAddHeapBoundaryLoading,
    data: addHeapBoundaryResponse,
    isSuccess: isAddHeapBoundarySuccess,
    isError: isAddHeapBoundaryError,
    error: addHeapBoundaryError,
  } = useAddHeap();

  const {
    data: iterationListResponse,
    isSuccess: isSuccessIterationList,
    isLoading: isLoadingIterationList,
    refetch: refetchIterationList,
  } = useIterationsList(
    { siteId: selectedTerrainSite?.id ?? '' },
    !isEmpty(selectedTerrainSite),
  );

  const { data: siteResponse, refetch: refetchCurrentSite } = useSite(
    !isEmpty(selectedTerrainSite),
    {
      siteId: selectedTerrainSite?.id ?? '',
    },
  );

  const {
    data: featuresResponse,
    isFetching: isLoadingFeaturesResponse,
    isSuccess: isSuccessFeaturesResponse,
    isError: isErrorFeaturesResponse,
    error: featuresResponseError,
    refetch: refetchFeatures,
  } = useFeatureList(
    values.workspaceLayer?.value.id ?? null,
    FeatureType.Polygon,
    false,
  );

  // useEffects.
  useEffect(() => {
    handleResponseErrorMessage(isErrorFeaturesResponse, featuresResponseError);
  }, [isErrorFeaturesResponse, featuresResponseError]);

  useEffect(() => {
    // Show the workspace layers when moved away from the heap tab.
    return () => {
      if (currentMarkedArea === HeapMarkArea.Draw) {
        setVectorLayerVisibility(visibleWorkspaceLayers, true);
      } else {
        setVectorLayerVisibility(workspaceLayers, false);
      }
    };
  }, [workspaceLayers]);

  useEffect(() => {
    if (cesiumProxy) {
      // Events.
      polygonTool?.addEventListener(
        PolygonEventType.DrawingEnd,
        endPolygonDrawingEventListener,
      );
    }
  }, []);

  useEffect(() => {
    if (isAddHeapBoundarySuccess && addHeapBoundaryResponse) {
      const heapResponse = addHeapBoundaryResponse.data;
      onSelectHeapHandler(heapResponse);
      heapListRefetch();
      setValues(heapInitialState);
      setActiveTabKey(heapTabs.List);
      resetHeapPolygons();
    }
    handleResponseMessage(
      isAddHeapBoundarySuccess,
      isAddHeapBoundaryError,
      addHeapBoundaryResponse,
      addHeapBoundaryError,
    );
  }, [
    isAddHeapBoundarySuccess,
    isAddHeapBoundaryError,
    addHeapBoundaryResponse,
  ]);

  useEffect(() => {
    if (!isEmpty(selectedTerrainSite)) {
      refetchCurrentSite();
    }
  }, [selectedTerrainSite]);

  useEffect(() => {
    if (isSuccessIterationList && iterationListResponse) {
      const iterations = iterationListResponse.list
        .filter((iterationOption) => {
          // Removing current iteration from the list.
          return iterationOption.id !== selectedTerrainIteration?.id;
        })
        .map((iterationOption) => {
          return {
            label: iterationOption.name,
            value: iterationOption,
          };
        });
      setIterationList(iterations);
    }
  }, [isSuccessIterationList, iterationListResponse]);

  useEffect(() => {
    if (
      values.baseReference.value === BaseReference.VisibleGround &&
      selectedTerrainIteration?.capturedDsm?.status !==
        StatusIndicatorLevel.Done
    ) {
      setErrors({
        ...errors,
        baseReference: FormErrorMessages.NoDSMForCurrentIteration,
      });
    } else if (
      values.baseReference.value === BaseReference.SiteBaseDsm &&
      siteResponse?.data.baseDSM?.status !== FileStatus.Done
    ) {
      setErrors({
        ...errors,
        baseReference: FormErrorMessages.NoDSMForSelectedSite,
      });
    } else if (
      values.baseReference.value === BaseReference.OtherIterationDsm &&
      values.otherIteration?.value.capturedDsm?.status !==
        StatusIndicatorLevel.Done
    ) {
      setErrors({
        ...errors,
        baseReference: FormErrorMessages.NoDSMForSelectedIteration,
      });
    } else {
      setErrors({
        ...errors,
        baseReference: '',
      });
    }
  }, [values.baseReference, values.otherIteration]);

  // useEffect - Handle addition & deletion of polygons when selected layer is changed.
  useEffect(() => {
    if (isNil(values.workspaceLayer)) {
      return;
    }

    refetchFeatures();

    // Clear all drawn heap polygons.
    deleteHeapPolygonsByMarkedArea(HeapMarkArea.Draw);

    /**
     * Clear all polygons from previously selected layers
     * (excluding the current selected layers polygons)
     **/
    const features = values.workspaceLayer?.value.features;
    const selectedHeapPolygonIds: Array<string> | undefined = features?.map(
      (feature) => {
        return feature.id + 'heap';
      },
    );
    deleteHeapPolygonsByMarkedArea(
      HeapMarkArea.LayerFromWorkspace,
      selectedHeapPolygonIds,
    );
  }, [values.workspaceLayer]);

  useEffect(() => {
    if (isSuccessFeaturesResponse && !isNil(featuresResponse)) {
      loadPolygonsFromWorkspace(featuresResponse.data.features);
    }
  }, [isSuccessFeaturesResponse, featuresResponse]);

  useEffect(() => {
    setOptional({
      ...optional,
      workspaceLayer: currentMarkedArea !== HeapMarkArea.LayerFromWorkspace,
    });
  }, [currentMarkedArea]);

  // Handlers.
  const startDrawingHandler = () => {
    polygonTool?.activate({
      heapMarkArea: HeapMarkArea.Draw,
    });
    dispatch(setCurrentActiveMapTool(MapTool.None));
    setIsDrawPolygonToolEnabled(true);
  };

  const endDrawingHandler = () => {
    polygonTool?.deactivate();
    setIsDrawPolygonToolEnabled(false);
  };

  const resetDrawingHandler = () => {
    resetHeapPolygons();
    setIsResetDrawingEnabled(false);
  };

  const onSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!polygonTool || isNil(selectedTerrainIteration)) {
      return;
    }

    const heapPolygonIds = polygonTool
      .getPolygonByProperty('heapMarkArea', currentMarkedArea)
      .map((heapPolygon) => {
        return heapPolygon.id;
      });

    if (heapPolygonIds.length === 0) {
      toast.error('Please draw or select a heap first.');
    } else {
      if (!inputHasError(getOptionalFields()) && inputIsDirty()) {
        toast.info(<span> Starting volume calculation. </span>);
        const polygonWKT = polygonTool?.exportMultiPolygonWkt(heapPolygonIds);

        let wktString: string | null = null;

        if (!isUndefined(polygonWKT) && !isEmpty(polygonWKT)) {
          wktString = polygonWKT;
        }

        polygonTool?.deactivate();
        setIsDrawPolygonToolEnabled(false);
        setIsResetDrawingEnabled(false);

        sendAddHeapBoundaryRequest({
          name: values.heapName,
          remarks: values.heapDescription,
          bulkDensity: values.bulkDensity,
          status: 1,
          iteration: selectedTerrainIteration.id,
          geometry: wktString,
          baseReference: values.baseReference.value,
          baseIteration: values.otherIteration?.value.id ?? '',
          materialType: values.materialType?.value,
          category: values.category?.value,
          includedInKpi: values.includedInKpi,
        });
      }
    }
  };

  const onRadioChange = (event) => {
    baseReferenceOptions.forEach((option) => {
      if (event.target.title === option.value) {
        setValues({ ...values, baseReference: option });
      }
    });
  };

  const onIterationChange = (
    selectedIteration: SelectOption<IterationListItem>,
  ) => {
    setValues({
      ...values,
      otherIteration: selectedIteration,
    });
  };

  const onToggleChange = (toggledLabel) => {
    const toggledValue = Formatter.camelCaseToSnakeCase(
      toggledLabel.split(' ').join(''),
    );

    /**
     * When switching from layer mode to draw mode, the heaps from layer mode should be deleted.
     * When switching from draw mode to layer mode, if there was any layer already selected,
     * that layers' polygons should be loaded.
     */
    if (toggledValue === HeapMarkArea.Draw) {
      setCurrentMarkedArea(HeapMarkArea.Draw);
      deleteHeapPolygonsByMarkedArea(HeapMarkArea.LayerFromWorkspace);
      setVectorLayerVisibility(visibleWorkspaceLayers, true);

      setErrors({
        ...errors,
        workspaceLayer: '',
      });

      setValues({
        ...values,
        workspaceLayer: null,
      });
    } else if (toggledValue === HeapMarkArea.LayerFromWorkspace) {
      setCurrentMarkedArea(HeapMarkArea.LayerFromWorkspace);
      setVectorLayerVisibility(workspaceLayers, false);
      deleteHeapPolygonsByMarkedArea(HeapMarkArea.Draw);

      if (
        isNil(polygonLayersSelectOption) ||
        polygonLayersSelectOption.length === 0
      ) {
        setErrors({
          ...errors,
          workspaceLayer: FormErrorMessages.NoActiveWorkspaceLayer,
        });
      }
    }
  };

  const loadPolygonsFromWorkspace = (
    featureResponse: FeatureResponseData[],
  ) => {
    for (const feature of featureResponse) {
      if (feature.type === FeatureType.Polygon) {
        polygonTool?.importWKT(
          feature.geometry,
          feature.id,
          {
            heapMarkArea: HeapMarkArea.LayerFromWorkspace,
          },
          feature.name,
        );
      }
    }
  };

  const deleteHeapPolygonsByMarkedArea = (
    heapMarkArea: HeapMarkArea,
    excludePolygons?: string[],
  ) => {
    const heapPolygons = polygonTool
      ?.getPolygonByProperty('heapMarkArea', heapMarkArea)
      .map((heapPolygon) => {
        return heapPolygon.id;
      });

    /**
     * XOR finds the symmetric difference.
     * Ref - https://en.wikipedia.org/wiki/Symmetric_difference
     * In this case, removes the excludePolygons from the heapPolygons.
     */
    const polygonsToDelete = xor(heapPolygons, excludePolygons);

    for (const polygon of polygonsToDelete) {
      polygonTool?.deleteById(polygon);
    }
  };

  const resetHeapPolygons = () => {
    polygonTool?.deletePolygonsByProperty('heapMarkArea', currentMarkedArea);
    dispatch(setCurrentEditableLayerId(null));
    dispatch(setShowUnsavedFeaturesModal(false));
  };

  const onSaveAndExit = () => {
    onSubmit();
    dispatch(setShowUnsavedFeaturesModal(false));
  };

  const endPolygonDrawingEventListener = () => {
    /**
     * Listener is activated only when a polygon is drawn completely. (Not when a polygon drawing is started but it ends w/o drawing a polygon)
     * Show reset btn only if polygon is drawn.
     */
    setIsResetDrawingEnabled(true);
  };

  // Render.
  return (
    <div className="volume-calculation-container">
      <UnsavedFeaturesModal
        show={showUnsavedFeaturesModal}
        onExit={resetHeapPolygons}
        onSaveAndExit={!isEmpty(values.heapName) ? onSaveAndExit : undefined}
      />
      <form className="volume-calculation__form" onSubmit={onSubmit}>
        <div className="input-field-container map-3d-sidebar-content">
          <InputGroup className="input-field--bold">
            <Input.Label>Current Iteration</Input.Label>
            <Input.Text disabled value={selectedTerrainIteration?.name} />
          </InputGroup>
          <InputGroup className="input-field--bold">
            <Input.Label>Base Iteration</Input.Label>
            <RadioToggleGroup
              radioOptions={baseReferenceOptions}
              onChange={(event) => {
                onRadioChange(event);
              }}
              checked={(option) => {
                return option.value === values.baseReference.value;
              }}
            />
          </InputGroup>
          {values.baseReference.value === BaseReference.OtherIterationDsm && (
            <InputGroup>
              <Input.Label>Select Iteration</Input.Label>
              <Input.Select
                placeholder="Select Iteration"
                options={iterationList}
                value={values.otherIteration}
                isLoading={isLoadingIterationList}
                onMenuOpen={refetchIterationList}
                onChange={onIterationChange}
                isDisabled={isEmpty(iterationList)}
                {...{ onBlur, onFocus }}
              />
            </InputGroup>
          )}
          {errors.baseReference && (
            <FormMessage message={errors.baseReference} />
          )}
          <InputGroup className="volume-calculation__drawing">
            <div className="volume-calculation__drawing__heading">
              Mark Area
            </div>
            <ToggleSwitch
              leftTitle={Formatter.toTitleCase(HeapMarkArea.Draw, '_')}
              rightTitle={Formatter.toTitleCase(
                HeapMarkArea.LayerFromWorkspace,
                '_',
              )}
              leftSelected={currentMarkedArea === HeapMarkArea.Draw}
              onChange={onToggleChange}
            />
            {errors.workspaceLayer && (
              <FormMessage message={errors.workspaceLayer} />
            )}
            {currentMarkedArea === HeapMarkArea.Draw ? (
              <div className="volume-calculation__drawing__btn">
                {isDrawPolygonToolEnabled ? (
                  <Button
                    className="volume-calculation__drawing__btn--exit-draw-polygon"
                    variant={ButtonVariant.Primary}
                    leftIconIdentifier={IconIdentifier.Heap}
                    onClick={endDrawingHandler}
                  >
                    Exit Drawing Mode
                  </Button>
                ) : (
                  <Button
                    className="volume-calculation__drawing__btn--draw-polygon"
                    variant={ButtonVariant.Outline}
                    leftIconIdentifier={IconIdentifier.Heap}
                    onClick={startDrawingHandler}
                    disabled={isDrawPolygonToolEnabled}
                  >
                    Enter Drawing Mode
                  </Button>
                )}

                {isResetDrawingEnabled && (
                  <Button
                    variant={ButtonVariant.Outline}
                    leftIconIdentifier={IconIdentifier.Reset}
                    onClick={resetDrawingHandler}
                    className="volume-calculation__drawing__btn--redo"
                  >
                    Reset Drawing
                  </Button>
                )}
              </div>
            ) : (
              <InputGroup className="volume-calculation__select-layer">
                <Input.Label>Select Layer</Input.Label>
                <Input.Select
                  placeholder="Select Layer from Workspace"
                  options={polygonLayersSelectOption}
                  value={values.workspaceLayer}
                  name={names.workspaceLayer}
                  isLoading={isLoadingFeaturesResponse}
                  onChange={(selectedLayer: SelectOption<WorkspaceLayer>) => {
                    setValues({ ...values, workspaceLayer: selectedLayer });
                  }}
                  {...{ onBlur, onFocus }}
                />
              </InputGroup>
            )}
          </InputGroup>
          <InputGroup>
            <Input.Label>Heap Name</Input.Label>
            <Input.Text
              value={values.heapName}
              name={names.heapName}
              error={errors.heapName}
              isInvalid={!!errors.heapName}
              placeholder="Heap Name"
              {...{ onChange, onBlur, onFocus }}
            ></Input.Text>
          </InputGroup>
          {/* Heap Category */}
          <InputGroup>
            <Input.Label>Heap Category</Input.Label>
            <Input.Select
              options={heapCategoryOptions}
              value={values.category}
              name={names.category}
              placeholder="Heap Category"
              onChange={(selectedHeapCategory) => {
                setValues({
                  ...values,
                  category: selectedHeapCategory,
                });
              }}
            />
          </InputGroup>
          {/* Heap Material */}
          <InputGroup>
            <Input.Label>Heap Material</Input.Label>
            <Input.Select
              options={heapMaterialOptions}
              value={values.materialType}
              name={names.materialType}
              placeholder="Heap Material"
              onChange={(selectedHeapMaterial) => {
                setValues({
                  ...values,
                  materialType: selectedHeapMaterial,
                });
              }}
            />
          </InputGroup>
          {/*
          NOTE: This might get enabled again in the future. Temporarily Disabled for now.

          {values.materialType?.value !== HeapMaterialType.Other && (
            <InputGroup className="volume-calculation__form__checkbox">
              <CheckBoxCard
                checked={values.includedInKpi}
                name={names.includedInKpi}
                title="Include heap in KPI calculation"
                onClick={() => {
                  setValues({
                    ...values,
                    includedInKpi: !values.includedInKpi,
                  });
                }}
              />
            </InputGroup>
          )} */}
          <InputGroup>
            <Input.Label>Description</Input.Label>
            <Input.Text
              value={values.heapDescription || ''}
              name={names.heapDescription}
              placeholder="Heap Description"
              maxLength={200}
              {...{ onChange }}
            ></Input.Text>
          </InputGroup>
          <InputGroup>
            <Input.Label>
              Bulk Density
              <span className="faded-label">
                (gm/cm<sup>3</sup>)
              </span>
            </Input.Label>
            <Input.Text
              value={values.bulkDensity || ''}
              name={names.bulkDensity.toString()}
              placeholder="Bulk Density"
              error={errors.bulkDensity}
              isInvalid={!!errors.bulkDensity}
              {...{ onChange, onBlur, onFocus }}
            ></Input.Text>
          </InputGroup>
        </div>
        <InputGroup className="btn-container">
          <Button
            type="submit"
            className="volume-calculation__submit-btn"
            isLoading={isAddHeapBoundaryLoading}
            disabled={isEmpty(values.heapName)}
          >
            Add Heap
          </Button>
        </InputGroup>
      </form>
    </div>
  );
};
