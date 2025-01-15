import { Spinner } from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  handleRefreshToken,
  useDisconnectProcessing,
  useProcessingConnection,
} from '../shared/api';
import { history } from '../shared/constants';
import { GlobalContext } from '../shared/context';
import { EnvVariables } from '../shared/env-variables';
import { TokenManager, isJsonString } from '../shared/helpers';
import { ExportFiles, NotConnectedWithProcessing } from './components';
import { ProcessingConnectionStatus, ProcessingMessageType } from './enums';
import { formatProcessingUrl } from './helpers';
import {
  ConnectionStatusDataType,
  ExportFilesDataType,
  MessageFromProcessing,
  ProcessingPathChangeDataType,
} from './type';

export const Processing: React.FC = () => {
  // Context.
  const { loggedUser, setLoggedUser } = useContext(GlobalContext);

  // Ref.
  const processingIframeRef = useRef<HTMLIFrameElement>(null);

  // States.
  const [iframeLoading, setIframeLoading] = useState(false);
  const [processingUrl, setProcessingUrl] = useState<string>();
  const [showExportFileModal, setShowExportFileModal] = useState(false);
  const [exportedFilesDataFromProcessing, setExportedFilesDataFromProcessing] =
    useState<ExportFilesDataType>();

  // Apis.
  const {
    data: processingConnectionResponse,
    refetch: refetchProcessingConnection,
    isSuccess,
    isLoading,
  } = useProcessingConnection(false);

  const {
    mutate: sendDisconnectWithProcessingRequest,
    isSuccess: isDisconnectWithProcessingSuccess,
  } = useDisconnectProcessing();

  // useEffects.
  useEffect(() => {
    window.addEventListener('message', onMessageReceivedFromProcessing);

    return () =>
      window.removeEventListener('message', onMessageReceivedFromProcessing);
  }, []);

  useEffect(() => {
    if (!!loggedUser?.isConnectedWithProcessing) {
      refetchProcessingConnection();
    }
  }, [loggedUser?.isConnectedWithProcessing]);

  useEffect(() => {
    if (processingIframeRef.current && !iframeLoading) {
      sendMessageToProcessing(ProcessingMessageType.RaAccessToken, {
        raAccessToken: TokenManager.getToken(),
      });
    }
  }, [iframeLoading]);

  useEffect(() => {
    if (processingConnectionResponse && isSuccess) {
      setIframeLoading(true);

      const processingOrgId = processingConnectionResponse.data.processingOrgId;

      setProcessingUrl(formatProcessingUrl(processingOrgId));
    }
  }, [processingConnectionResponse, isSuccess]);

  useEffect(() => {
    if (isDisconnectWithProcessingSuccess && loggedUser) {
      setLoggedUser({
        ...loggedUser,
        isConnectedWithProcessing: false,
      });
    }
  }, [isDisconnectWithProcessingSuccess]);

  // Helpers.
  const sendMessageToProcessing = (
    messageType: ProcessingMessageType,
    messageData: object,
  ) => {
    const message = JSON.stringify({
      messageType,
      data: messageData,
    });

    processingIframeRef.current?.contentWindow?.postMessage(
      message,
      EnvVariables.processingUrl,
    );
  };

  // Handlers.
  const openExportFileModal = () => setShowExportFileModal(true);
  const closeExportFileModal = () => setShowExportFileModal(false);

  const onChangeProcessingPathHandler = (
    data: ProcessingPathChangeDataType,
  ) => {
    const { path: processingPath, search: processingSearchParamString } = data;

    // Update current url according to processing url.
    const processingSearchParams = new URLSearchParams(
      processingSearchParamString,
    );
    processingSearchParams.delete('org_id');

    history.replace(
      `/processing${processingPath}?${processingSearchParams.toString()}`,
    );
  };

  // Receive messages from RP.
  const onMessageReceivedFromProcessing = (event: MessageEvent) => {
    if (!isJsonString(event.data)) {
      return;
    }
    const messageFromProcessing: MessageFromProcessing = JSON.parse(event.data);

    switch (messageFromProcessing.messageType) {
      case ProcessingMessageType.ExportDsmOrtho: {
        const data: ExportFilesDataType = messageFromProcessing.data;
        setExportedFilesDataFromProcessing(data);
        openExportFileModal();
        break;
      }

      case ProcessingMessageType.ConnectionStatus: {
        const data: ConnectionStatusDataType = messageFromProcessing.data;
        if (data.connectionStatus === ProcessingConnectionStatus.Closed) {
          /*
          Need to pass undefined because react-query useMutation's args is not optional this is a problem in react-query.
          TODO: Remove undefined when react-query fix this bug
          */
          sendDisconnectWithProcessingRequest(undefined);
        }
        break;
      }

      case ProcessingMessageType.AuthenticationFailed: {
        handleRefreshToken().then(() => {
          sendMessageToProcessing(ProcessingMessageType.RaAccessToken, {
            raAccessToken: TokenManager.getToken(),
          });
        });
        break;
      }

      case ProcessingMessageType.PathChanged: {
        const data: ProcessingPathChangeDataType = messageFromProcessing.data;
        if (data.path) {
          onChangeProcessingPathHandler(data);
        }
        break;
      }
    }
  };

  return (
    <>
      {(isNil(loggedUser) || isLoading || iframeLoading) && <Spinner />}

      {loggedUser?.isConnectedWithProcessing ? (
        <>
          <div className="iframe-container">
            {!isEmpty(processingUrl) && (
              <iframe
                src={processingUrl}
                className="iframe-container"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture full"
                onLoad={() => setIframeLoading(false)}
                ref={processingIframeRef}
              />
            )}
          </div>

          {exportedFilesDataFromProcessing && (
            <ExportFiles
              show={showExportFileModal}
              onClose={closeExportFileModal}
              exportedFilesDataFromProcessing={exportedFilesDataFromProcessing}
            />
          )}
        </>
      ) : (
        <NotConnectedWithProcessing />
      )}
    </>
  );
};
