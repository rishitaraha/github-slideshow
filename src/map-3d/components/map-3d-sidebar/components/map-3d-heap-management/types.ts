import {
  HeapListResponseDataObj,
  HeapResponseDataTypeObj,
} from '../../../../../shared/api';
import { SelectedHeapType } from './components';

export type HeapApiOptionType = {
  heapListResponse: HeapListResponseDataObj | undefined;
  isHeapListLoading: boolean;
  heapListRefetch: () => void;
  selectedHeaps: SelectedHeapType | null;
  onSelectHeapHandler: (selectedHeap: HeapResponseDataTypeObj) => void;
  setActiveTabKey: (key: string) => void;
};
