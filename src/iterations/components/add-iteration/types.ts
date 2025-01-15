export type AddIterationProps = {
  show: boolean;
  closeAddIteration: () => void;
  refetch: () => void;
};

export type AddIterationInput = {
  name: string;
  date: string;
  info?: string;
  capturedDSM: File | null;
};
