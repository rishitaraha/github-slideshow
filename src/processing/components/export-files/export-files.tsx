import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SelectOption,
  CheckBox,
} from '@aus-platform/design-system';
import { isEmpty, isNil, isNull } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import {
  ExportFilesFromProcessingPayloadType,
  handleResponseMessage,
  useExportFilesFromProcessing,
  useIterationsList,
  useProjectList,
  useSiteList,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { ExportFilesDataType } from '../../type';
import { ExportFailed, ExportInProgress } from './components';
import { ExportStatus } from './enums';
import { ExportFileFormInputType } from './types';

type ExportFilesProps = ModalProps & {
  exportedFilesDataFromProcessing: ExportFilesDataType;
  onClose: () => void;
};

const exportFilesInitialInputState: ExportFileFormInputType = {
  isOrthoExported: false,
  isDsmExported: false,
  orthoLayerName: '',
  project: null,
  site: null,
  iteration: null,
};

export const ExportFiles: React.FC<ExportFilesProps> = ({
  exportedFilesDataFromProcessing,
  onClose,
  show,
  ...rest
}) => {
  // States.
  const {
    values,
    names,
    errors,
    setErrors,
    setValues,
    onFocus,
    onBlur,
    inputHasError,
    getOptionalFields,
    setOptional,
    optional,
    onChange,
  } = useInputFields<ExportFileFormInputType>(exportFilesInitialInputState);

  const [projects, setProjects] = useState<SelectOption<string>[]>();
  const [sites, setSites] = useState<SelectOption<string>[]>();
  const [iterations, setIterations] = useState<SelectOption<string>[]>();
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);

  // Constants.
  const isDSMPresent =
    !isNil(exportedFilesDataFromProcessing.dsm) ||
    !isNil(exportedFilesDataFromProcessing.dsm_cog);

  // Apis.
  const {
    data: projectListResponse,
    isLoading: isLoadingProjectList,
    isSuccess: isSuccessProjectList,
  } = useProjectList();

  const {
    data: siteListResponse,
    isLoading: isLoadingSiteList,
    isSuccess: isSuccessSiteList,
    refetch: refetchSiteList,
  } = useSiteList(
    {
      projectId: values.project?.value ?? '',
      includeFields: ['id', 'name'],
    },
    false,
  );

  const {
    data: iterationListResponse,
    isLoading: isLoadingIterationList,
    isSuccess: isSuccessIterationList,
    refetch: refetchIterationList,
  } = useIterationsList(
    {
      siteId: values.site?.value ?? '',
    },
    false,
  );

  const {
    mutate: sendExportFilesRequest,
    data: exportFilesResponse,
    isSuccess: exportFilesRequestIsSuccess,
    isPending: exportFilesRequestIsLoading,
    isError: exportFilesRequestHasError,
    error: exportFilesRequestErrors,
  } = useExportFilesFromProcessing();

  // useEffects.
  useEffect(() => {
    if (show) {
      setValues({
        ...values,
        // Checking if the orthomosaic and dsm is coming from RP or not. if not we will set it to false.
        isDsmExported: isDSMPresent,
        isOrthoExported: !isEmpty(
          exportedFilesDataFromProcessing.orthophoto_cog,
        ),
      });
      return () => {
        setValues(exportFilesInitialInputState);
        setExportStatus(null);
      };
    }
  }, [show]);

  useEffect(() => {
    if (projectListResponse && isSuccessProjectList) {
      setProjects(
        projectListResponse.data.projects.map((project) => {
          return { label: project.name, value: project.id };
        }),
      );
    }
  }, [projectListResponse, isSuccessProjectList]);

  useEffect(() => {
    if (siteListResponse && isSuccessSiteList) {
      setSites(
        siteListResponse.list.map((site) => {
          return { label: site.name, value: site.id };
        }),
      );
    }
  }, [siteListResponse, isSuccessSiteList]);

  useEffect(() => {
    if (iterationListResponse && isSuccessIterationList) {
      setIterations(
        iterationListResponse.list.map((iteration) => {
          return {
            label: iteration.name,
            value: iteration.id,
          };
        }),
      );
    }
  }, [iterationListResponse, isSuccessIterationList]);

  useEffect(() => {
    if (values.project) {
      refetchSiteList();
    }
  }, [values.project]);

  useEffect(() => {
    if (values.site) {
      refetchIterationList();
    }
  }, [values.site]);

  useEffect(() => {
    if (exportFilesRequestIsSuccess && exportFilesResponse) {
      setExportStatus(ExportStatus.InProgress);
    } else if (exportFilesRequestHasError) {
      setExportStatus(ExportStatus.Failed);
    } else {
      handleResponseMessage(
        exportFilesRequestIsSuccess,
        exportFilesRequestHasError,
        exportFilesResponse,
        exportFilesRequestErrors,
      );
    }
  }, [
    exportFilesRequestIsSuccess,
    exportFilesResponse,
    exportFilesRequestHasError,
  ]);

  useEffect(() => {
    setOptional({
      ...optional,
      isOrthoExported: true,
      isDsmExported: true,
      orthoLayerName: !values.isOrthoExported,
    });

    // Clear layer name errors when checkbox is changed.
    if (!values.isOrthoExported) {
      setErrors({
        ...errors,
        orthoLayerName: '',
      });
    }
  }, [values.isOrthoExported]);

  // Conditional variables.
  const isExportFormError = inputHasError(getOptionalFields());

  // Handlers.
  const onProjectChange = (selectedProject) => {
    setValues({
      ...values,
      project: selectedProject,
      site: null,
      iteration: null,
    });
  };

  const onSiteChange = (selectedSite) => {
    setValues({ ...values, site: selectedSite, iteration: null });
  };

  const onIterationChange = (selectedIteration) => {
    setValues({ ...values, iteration: selectedIteration });
  };

  const onExportBtnClick = (event) => {
    event.preventDefault();

    if (!isExportFormError) {
      const payload: ExportFilesFromProcessingPayloadType = {
        iterationId: values.iteration?.value ?? '',
      };

      if (values.isOrthoExported) {
        payload['orthomosaic'] = exportedFilesDataFromProcessing.orthophoto_cog;
        payload['orthoLayerName'] = values.orthoLayerName;
      }

      if (values.isDsmExported) {
        payload['dsm'] = !isNil(exportedFilesDataFromProcessing.dsm_cog)
          ? exportedFilesDataFromProcessing.dsm_cog
          : exportedFilesDataFromProcessing.dsm;
      }

      sendExportFilesRequest(payload);
    }
  };

  // Renders.
  const renderModalBody = () => {
    if (exportStatus === ExportStatus.InProgress) {
      return <ExportInProgress siteId={values.site?.value} />;
    } else if (exportStatus === ExportStatus.Failed) {
      return <ExportFailed />;
    }

    return (
      <>
        <InputGroup className="export-files__checkbox-container">
          <Input.Label>Select Outputs</Input.Label>
          <CheckBox
            title="Orthomosaic"
            checked={values.isOrthoExported}
            name={names.exportOrthomosaic}
            onClick={() =>
              setValues({
                ...values,
                isOrthoExported: !values.isOrthoExported,
              })
            }
            // Disable if ortho is not coming from RP.
            disabled={isEmpty(exportedFilesDataFromProcessing.orthophoto_cog)}
            {...{ onFocus, onBlur }}
          />
          <CheckBox
            title="DSM"
            checked={values.isDsmExported}
            name={names.exportDSM}
            onClick={() =>
              setValues({ ...values, isDsmExported: !values.isDsmExported })
            }
            // Disable if dsm is not coming from RP.
            disabled={!isDSMPresent}
            {...{ onFocus, onBlur }}
          />
        </InputGroup>

        <InputGroup>
          <Input.Label>Orthomosaic Layer Name</Input.Label>
          <Input.Text
            name={names.orthoLayerName}
            value={values.orthoLayerName}
            error={errors.orthoLayerName}
            disabled={!values.isOrthoExported}
            {...{ onBlur, onFocus, onChange }}
          />
        </InputGroup>
        <InputGroup>
          <Input.Label>Select Project</Input.Label>
          <Input.Select
            placeholder="Select Project"
            value={values.project}
            name={names.project}
            error={errors.project}
            options={projects}
            isLoading={isLoadingProjectList}
            onChange={onProjectChange}
            {...{ onFocus, onBlur }}
          />
        </InputGroup>

        <InputGroup>
          <Input.Label>Select Site</Input.Label>
          <Input.Select
            placeholder="Select Site"
            value={values.site}
            name={names.site}
            error={errors.site}
            options={sites}
            isDisabled={isEmpty(values.project)}
            isLoading={isLoadingSiteList}
            onChange={onSiteChange}
            {...{ onFocus, onBlur }}
          />
        </InputGroup>

        <InputGroup>
          <Input.Label>Select Iteration</Input.Label>
          <Input.Select
            placeholder="Select Iteration"
            value={values.iteration}
            name={names.iteration}
            error={errors.iteration}
            options={iterations}
            isDisabled={isEmpty(values.site)}
            isLoading={isLoadingIterationList}
            onChange={onIterationChange}
            {...{ onFocus, onBlur }}
          />
        </InputGroup>
      </>
    );
  };

  return (
    <Modal
      {...rest}
      show={show}
      onHide={onClose}
      size="sm"
      backdrop="static"
      dialogClassName="export-files"
      centered
    >
      <Modal.Header closeButton>Export</Modal.Header>
      <Modal.Body>{renderModalBody()}</Modal.Body>
      <Modal.Footer className="export-files__btn-container">
        {isNull(exportStatus) ? (
          <>
            <Button variant={ButtonVariant.Secondary} onClick={onClose}>
              Cancel
            </Button>

            <Button
              disabled={isExportFormError}
              onClick={onExportBtnClick}
              isLoading={exportFilesRequestIsLoading}
            >
              Export
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
