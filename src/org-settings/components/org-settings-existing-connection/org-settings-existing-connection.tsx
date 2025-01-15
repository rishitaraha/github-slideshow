import {
  Button,
  ButtonVariant,
  FormMessage,
  FormMessageVariant,
  Input,
  InputGroup,
  Spinner,
} from '@aus-platform/design-system';
import React, { useEffect } from 'react';
import {
  handleResponseMessage,
  useCreateProcessingConnection,
  useDisconnectProcessing,
  useProcessingConnection,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';

type OrgSettingsExistingConnectionProps = {
  isConnectedWithProcessing: boolean;
  setIsConnectedWithProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};

const existingConnectionInitialState = {
  processingOrgId: '',
  connectionToken: '',
};

export const OrgSettingsExistingConnection: React.FC<
  OrgSettingsExistingConnectionProps
> = ({ isConnectedWithProcessing, setIsConnectedWithProcessing }) => {
  // States.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onFocus,
    onBlur,
    inputHasError,
    inputIsDirty,
  } = useInputFields(existingConnectionInitialState);

  // Apis.
  const {
    data: processingConnectionResponse,
    isSuccess: isProcessingConnectionFetchSuccess,
    isLoading: isProcessingConnectionFetchLoading,
  } = useProcessingConnection(isConnectedWithProcessing);

  const {
    mutate: sendConnectWithProcessingRequest,
    isSuccess: isConnectionWithProcessingSuccess,
    isPending: isConnectionWithProcessingLoading,
    data: connectWithProcessingResponse,
    isError: isConnectionWithProcessingHasError,
    error: connectionWithProcessingErrors,
  } = useCreateProcessingConnection();

  const {
    mutate: sendDisconnectWithProcessingRequest,
    isSuccess: isDisconnectWithProcessingSuccess,
    isPending: isDisconnectWithProcessingLoading,
  } = useDisconnectProcessing();

  // useEffects.
  useEffect(() => {
    if (
      isConnectedWithProcessing &&
      processingConnectionResponse &&
      isProcessingConnectionFetchSuccess
    ) {
      setValues({
        processingOrgId: processingConnectionResponse.data.processingOrgId,
        connectionToken: processingConnectionResponse.data.connectionToken,
      });
    }
    return () => setValues(existingConnectionInitialState);
  }, [processingConnectionResponse, isProcessingConnectionFetchSuccess]);

  useEffect(() => {
    if (isDisconnectWithProcessingSuccess) {
      setValues(existingConnectionInitialState);
      setIsConnectedWithProcessing(false);
    }
  }, [isDisconnectWithProcessingSuccess]);

  useEffect(() => {
    if (isConnectionWithProcessingSuccess && connectWithProcessingResponse) {
      setIsConnectedWithProcessing(true);
    }

    handleResponseMessage(
      isConnectionWithProcessingSuccess,
      isConnectionWithProcessingHasError,
      connectWithProcessingResponse,
      connectionWithProcessingErrors,
    );
  }, [
    isConnectionWithProcessingSuccess,
    connectWithProcessingResponse,
    isConnectionWithProcessingHasError,
  ]);

  // Handlers.
  const onConnectBtnClick = (event) => {
    event.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendConnectWithProcessingRequest(values);
    }
  };

  return isConnectedWithProcessing && isProcessingConnectionFetchLoading ? (
    <div className="org-settings__existing-connection_spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className="org-settings__existing-connection">
      <InputGroup>
        <Input.Label>Organisation ID</Input.Label>
        <Input.Text
          placeholder="Enter Organisation ID"
          value={values.processingOrgId}
          name={names.processingOrgId}
          error={errors.processingOrgId}
          isInvalid={!!errors.processingOrgId}
          disabled={isConnectedWithProcessing}
          {...{ onChange, onFocus, onBlur }}
        />
      </InputGroup>
      <InputGroup className="mt-3">
        <Input.Label>Rainbow Connection Token</Input.Label>
        <Input.Text
          placeholder="Enter Rainbow Connection Token"
          value={values.connectionToken}
          name={names.connectionToken}
          error={errors.connectionToken}
          isInvalid={!!errors.connectionToken}
          disabled={isConnectedWithProcessing}
          {...{ onChange, onFocus, onBlur }}
        />
      </InputGroup>

      {isConnectedWithProcessing ? (
        <div className="org-settings__existing-connection__disconnect-btn-container">
          <FormMessage
            message={
              <>
                Connected to&nbsp;
                <span>
                  {processingConnectionResponse?.data.processingOrgName}
                </span>
              </>
            }
            variant={FormMessageVariant.Success}
          />
          <Button
            variant={ButtonVariant.Outline}
            className="org-settings__existing-connection__disconnect-btn"
            isLoading={isDisconnectWithProcessingLoading}
            onClick={sendDisconnectWithProcessingRequest}
          >
            {isDisconnectWithProcessingLoading ? 'Disconnecting' : 'Disconnect'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={onConnectBtnClick}
          isLoading={isConnectionWithProcessingLoading}
          disabled={inputHasError()}
        >
          {isConnectionWithProcessingLoading ? 'Connecting' : 'Connect'}
        </Button>
      )}
    </div>
  );
};
