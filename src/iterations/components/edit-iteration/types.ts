export type EditIterationProps = {
  show: boolean;
  closeEditIteration: () => void;
  refetch: () => void;
  iterationId: string;
};

export type EditIterationInput = {
  name: string;
  date: string;
  info?: string;
  capturedDSM: File | null;
};
