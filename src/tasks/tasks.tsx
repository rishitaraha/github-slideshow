import React, { useContext, useEffect, useState } from 'react';
import {
  Button,
  generateColor,
  IconIdentifier,
  Spinner,
  toast,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import { IterationDatasetContext } from './contexts/iteration-context';
import { GCPSchemaModal } from './gcp-schema-modal';
import { GeotagImagesModal, GeotagImagesProvider } from './geotag-images-modal';
import { InputDataCard } from './input-data-card';
import { NoDataView } from './no-data-view/no-data-view';
import { UploadGCPModal } from './upload-gcp-modal';
import { GeotagsModalUploadPreview } from './upload-geotags-modal';
import { FinalStateTaskStatus } from './constants';
import { UploadImagesModal } from './upload-images';
import { CreateTaskCard } from './create-task-card/create-task-card';
import { TaskAccordion } from './task-details-card';
import { ProgressContext } from './contexts';
import { RoutesEnum } from 'shared/routes';

import {
  CreateTaskPayload,
  handleResponseErrorMessage,
  Iteration,
  IterationDataset,
  Task,
  useCreateIterationDatasetRequest,
  useCreateTaskRequest,
  useIteration,
  useIterationDatasetRequest,
  usePresetsListRequest,
} from 'shared/api';

import { ComponentRoute } from 'shared/types';

export const Tasks: React.FC<{ iterationId: string }> & ComponentRoute = ({
  iterationId,
}) => {
  // States.
  const [iterationObj, setIterationObj] = useState<Iteration>();
  const [isReupload, setIsReupload] = useState(false);
  const [showCreateTaskHeader, setShowCreateTaskHeader] = useState(false);
  const [showGeotagsUploadModal, setShowGeotagsUploadModal] = useState(false);
  const [showGeotagImagesModal, setShowGeotagImagesModal] = useState(false);
  const [showGCPUploadModal, setShowGCPUploadModal] = useState(false);
  const [iterationDataset, setIterationDataset] = useState<IterationDataset>();
  const [showUploadImagesModal, setShowUploadImagesModal] = useState(false);
  const [showGCPSchemaModal, setShowGCPSchemaModal] = useState(false);
  const [showCreateTaskCard, setShowCreateTaskCard] = useState(false);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [logsEnabledTaskId, setLogsEnabledTaskId] = useState<string>();
  const [duplicatedTask, setDuplicatedTask] = useState<Task>();

  // Contexts.
  const { addDatasetsForProgressTracking } = useContext(ProgressContext);

  // API Hooks.
  const {
    mutate: sendCreateIterationDataset,
    data: createIterationDatasetResponse,
    isSuccess: isSuccessIterationDatasetRequest,
    isError: isErrorIterationDatasetRequest,
    error: createIterationDatasetError,
  } = useCreateIterationDatasetRequest();

  const {
    mutate: sendCreateTaskRequest,
    data: createTaskResponse,
    isSuccess: isSuccessCreateTask,
    isError: isErrorCreateTask,
    error: createTaskError,
  } = useCreateTaskRequest();

  const {
    data: iterationDataResponse,
    isSuccess: isSuccessIterationDataResponse,
    isError: isErrorIterationDataResponse,
    error: iterationDataResponseError,
  } = useIteration(iterationId, true, !iterationDataset);

  const {
    data: iterationDatasetResponse,
    isSuccess: isSuccessIterationDatasetResponse,
    isError: isErrorIterationDatasetResponse,
    isFetching: isFetchingIterationDataset,
    error: iterationDatasetResponseError,
    refetch: refetchIterationDatasetResponse,
  } = useIterationDatasetRequest(
    { iterationDatasetId: iterationDataset?.id ?? '' },
    !!iterationDataset,
  );

  const {
    data: presetsListResponse,
    isError: isErrorPresetsListResponse,
    isSuccess: isSuccessPresetsListResponse,
  } = usePresetsListRequest(
    { iterationDatasetId: iterationDataset?.id ?? '' },
    !!iterationDataset,
  );

  useEffect(() => {
    if (isErrorPresetsListResponse) {
      toast.error('Error occurred while fetching presets.');
    }
  }, [
    isSuccessPresetsListResponse,
    isErrorPresetsListResponse,
    presetsListResponse,
  ]);

  // useEffects.
  useEffect(() => {
    if (isSuccessIterationDatasetResponse && iterationDatasetResponse) {
      const iterationDataset = iterationDatasetResponse.data;
      setIterationDataset(iterationDataset);
      const taskList = iterationDataset.tasks;
      if (!isNil(taskList) && !isEmpty(taskList)) {
        setTasksList(taskList);
        setShowCreateTaskHeader(true);
        const uncompletedTasksIds = taskList
          .filter(({ status }) => !FinalStateTaskStatus.includes(status))
          .map(({ id }) => id);
        addDatasetsForProgressTracking(uncompletedTasksIds);
      }
    } else if (isErrorIterationDataResponse) {
      handleResponseErrorMessage(
        isErrorIterationDatasetResponse,
        iterationDatasetResponseError,
      );
    }
  }, [
    isSuccessIterationDatasetResponse,
    isErrorIterationDatasetResponse,
    iterationDatasetResponse,
  ]);

  useEffect(() => {
    if (isSuccessIterationDataResponse && iterationDataResponse) {
      const iteration = iterationDataResponse.data;
      setIterationObj(iteration);

      if (iteration.iterationDataset) {
        setIterationDataset(iteration.iterationDataset);
      }
    } else if (isErrorIterationDataResponse) {
      handleResponseErrorMessage(
        isErrorIterationDataResponse,
        iterationDataResponseError,
      );
    }
  }, [
    isSuccessIterationDataResponse,
    isErrorIterationDataResponse,
    iterationDataResponse,
    iterationDataResponseError,
  ]);

  useEffect(() => {
    if (createIterationDatasetResponse && isSuccessIterationDatasetRequest) {
      setShowUploadImagesModal(true);
      setIterationDataset(createIterationDatasetResponse.data);
    } else if (isErrorIterationDatasetRequest) {
      handleResponseErrorMessage(
        isErrorIterationDataResponse,
        createIterationDatasetError,
      );
    }
  }, [
    isSuccessIterationDataResponse,
    createIterationDatasetResponse,
    isErrorIterationDataResponse,
  ]);

  useEffect(() => {
    if (isSuccessCreateTask && createTaskResponse) {
      refetchIterationDatasetResponse();
      toast.success('Task created successfully.');
      setTasksList([]);
      hideCreateTaskCard();
    } else if (isErrorCreateTask) {
      handleResponseErrorMessage(isErrorCreateTask, createTaskError);
    }
  }, [isSuccessCreateTask, isErrorCreateTask, createTaskResponse]);

  // Handlers.
  const displayUploadGeotagsFile = () => {
    setShowGeotagsUploadModal(true);
  };
  const hideUploadGeotagsModal = () => {
    setShowGeotagsUploadModal(false);
  };

  const hideUploadImagesModal = () => {
    setShowUploadImagesModal(false);
    refetchIterationDatasetResponse();
  };
  const hideGcpUploadModal = () => {
    refetchIterationDatasetResponse();
    setShowGCPUploadModal(false);
  };
  const displayGeotagImagesModal = () => setShowGeotagImagesModal(true);
  const hideGeotagImagesModal = () => setShowGeotagImagesModal(false);

  const onUploadImages = (isReUpload = false) => {
    if (!isNil(iterationDataset)) {
      setShowUploadImagesModal(true);
      setIsReupload(isReUpload);
    } else if (iterationObj) {
      sendCreateIterationDataset(iterationObj.id);
    }
  };

  const displayGCPSchemaModal = () => setShowGCPSchemaModal(true);
  const displayGCPUploadModal = () => setShowGCPUploadModal(true);

  const displayCreateTaskCard = () => {
    setShowCreateTaskHeader(false);
    setShowCreateTaskCard(true);
  };

  const hideCreateTaskCard = () => {
    setShowCreateTaskCard(false);
    setDuplicatedTask(undefined);
    if (!isEmpty(tasksList)) {
      setShowCreateTaskHeader(true);
    }
  };

  const onSubmitCreateTask = (payload: CreateTaskPayload) => {
    sendCreateTaskRequest(payload);
  };

  const onDuplicateTask = (task: Task) => {
    setDuplicatedTask(task);
    setShowCreateTaskCard(true);
  };

  const onCloseGcpModal = () => {
    refetchIterationDatasetResponse();
    setShowGCPSchemaModal(false);
  };

  // Render.
  const handleAddMoreImages = () => {
    const isReupload =
      !!iterationDataset && iterationDataset.numberOfImages > 0;
    onUploadImages(isReupload);
  };

  const renderEmptyDataView = () => {
    if (isNil(iterationDataset) || iterationDataset?.numberOfImages === 0) {
      return (
        <div className="upload-view">
          <NoDataView resourceName="Images" onClick={onUploadImages} />
        </div>
      );
    } else if (!iterationDataset?.areGeotagsPresent) {
      return (
        <div className="upload-view">
          <NoDataView
            resourceName="Geotags"
            onClick={displayUploadGeotagsFile}
          />
        </div>
      );
    } else if (isEmpty(iterationDataset.tasks)) {
      return (
        <NoDataView resourceName="Tasks" onClick={displayCreateTaskCard} />
      );
    }
  };

  const renderTasksList = () =>
    iterationDataset && (
      <div className="mb-5">
        {tasksList.map((task, index) => {
          return (
            <TaskAccordion key={'task ' + index}>
              <TaskAccordion.Item
                eventKey={`${index}`}
                task={task}
                iterationDataset={iterationDataset}
                color={generateColor(index)}
                onDuplicateTask={onDuplicateTask}
                logsEnabledTaskId={logsEnabledTaskId}
                enableLogsForTask={setLogsEnabledTaskId}
              />
            </TaskAccordion>
          );
        })}
      </div>
    );

  return (
    <>
      {isNil(iterationObj) || isFetchingIterationDataset ? (
        <Spinner />
      ) : (
        <>
          <IterationDatasetContext.Provider
            value={{
              iterationDataset: iterationDataset as IterationDataset,
              refetchIterationDataset: refetchIterationDatasetResponse,
            }}
          >
            <InputDataCard
              {...{
                displayGeotagImagesModal,
                handleAddMoreImages,
                displayGCPSchemaModal,
                displayGCPUploadModal,
              }}
            />
            {showCreateTaskHeader && (
              <div className="d-flex flex-row-reverse my-4">
                <Button
                  leftIconIdentifier={IconIdentifier.Plus}
                  onClick={displayCreateTaskCard}
                >
                  Create Task
                </Button>
              </div>
            )}
            {showCreateTaskCard && (
              <CreateTaskCard
                color={generateColor(0)}
                onStartProcessing={onSubmitCreateTask}
                presetsList={presetsListResponse ?? []}
                tasksList={tasksList}
                onCancel={hideCreateTaskCard}
                duplicatedTask={duplicatedTask}
              />
            )}
            {!showCreateTaskCard && renderEmptyDataView()}
            {renderTasksList()}
            {showUploadImagesModal && (
              <UploadImagesModal {...{ hideUploadImagesModal, isReupload }} />
            )}
            {showGeotagsUploadModal && (
              <GeotagsModalUploadPreview onClose={hideUploadGeotagsModal} />
            )}
            {showGeotagImagesModal && iterationDataset && (
              <GeotagImagesProvider
                {...{
                  iterationDataset,
                  onUploadImages,
                  displayUploadGeotagsFile,
                }}
              >
                <GeotagImagesModal onClose={hideGeotagImagesModal} />
              </GeotagImagesProvider>
            )}
            {iterationDataset && showGCPUploadModal && (
              <UploadGCPModal {...{ hideGcpUploadModal }} />
            )}
            {iterationDataset && showGCPSchemaModal && (
              <GCPSchemaModal
                show={showGCPSchemaModal}
                onClose={onCloseGcpModal}
              />
            )}
          </IterationDatasetContext.Provider>
        </>
      )}
    </>
  );
};

Tasks.route = RoutesEnum.Tasks;
