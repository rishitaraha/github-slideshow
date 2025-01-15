import { createContext, useContext } from 'react';
import { IterationDatasetContextType } from '../types';

export const IterationDatasetContext = createContext<
  IterationDatasetContextType | undefined
>(undefined);

export const useIterationDatasetContext = () => {
  const context = useContext(IterationDatasetContext);
  if (!context) {
    throw new Error(
      'useIterationDatasetContext must be used within a IterationDatasetContext',
    );
  }
  return context;
};
