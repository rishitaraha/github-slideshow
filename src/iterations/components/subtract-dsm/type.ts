import { SelectOption } from '@aus-platform/design-system';
import { ModalProps } from 'react-bootstrap';

export type SubtractDsmModalProps = ModalProps & {
  onClose: () => void;
  siteId: string;
  refetchIterationFn: () => void;
};

export type SubtractDsmInput = {
  iterationName: string;
  date: string;
  firstIteration: SelectOption | null;
  secondIteration: SelectOption | null;
  thresholdValue: number;
  iterationForOrtho: SelectOption | null;
  orthoLayers: SelectOption | null;
};
