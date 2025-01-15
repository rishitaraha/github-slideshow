import { isEmpty } from 'lodash';
import {
  createContext,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import { getSseEventSource } from '../helpers';

type ProgressDetailsType = {
  progressDetails: string;
  progressStatus: string;
};

type ProgressDetailsObjectType = {
  [uuid: string]: ProgressDetailsType;
};

export const ProgressContext = createContext<any>(null);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({
  children,
}): ReactElement => {
  const [datasetsRequiringSse, setDatasetsRequiringSse] = useState<string[]>(
    [],
  );
  const [progressDetails, setProgressDetails] =
    useState<ProgressDetailsObjectType>({});

  useEffect(() => {
    if (!isEmpty(datasetsRequiringSse)) {
      const progressDetailsEndpoint =
        '/progress_details?is_rainbow=true&process_ids=';

      const progressEventSource = getSseEventSource(
        datasetsRequiringSse,
        progressDetailsEndpoint,
      );
      // Event Listeners for SSE messages.
      progressEventSource.onmessage = (message: MessageEvent<string>) => {
        const sseMessages = JSON.parse(`${message.data.replaceAll("'", '"')}`);
        const progressDetailsObj = {};

        for (const [datasetId, progressDetails] of Object.entries<any>(
          sseMessages,
        )) {
          const progressStatus = progressDetails['progress_status'];
          const progressPercentage = parseInt(
            progressDetails['progress_percentage'],
          );
          progressDetailsObj[datasetId] = {
            progressStatus,
            progressPercentage,
          };
        }
        setProgressDetails(progressDetailsObj);
      };
      progressEventSource.onerror = () => {
        progressEventSource.close();
      };
      if (datasetsRequiringSse.length == 0) {
        return () => progressEventSource.close();
      }
    }
  }, [datasetsRequiringSse]);

  const removeDatasetFromProgressTracking = (datasetIdToRemove: string) => {
    setDatasetsRequiringSse((prev) =>
      prev.filter((prevDatasetId) => prevDatasetId !== datasetIdToRemove),
    );
  };

  const addDatasetsForProgressTracking = (datasetIds: string[]) => {
    setDatasetsRequiringSse((prev) => [...prev, ...datasetIds]);
  };

  return (
    <ProgressContext.Provider
      value={{
        progressDetails,
        removeDatasetFromProgressTracking,
        addDatasetsForProgressTracking,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
