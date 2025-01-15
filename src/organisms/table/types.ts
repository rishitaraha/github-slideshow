import {
  OnChangeFn,
  Row,
  RowModel,
  RowSelectionState,
  TableOptions,
} from '@tanstack/react-table';
import { SelectOption } from '../../molecules';
import { MultiValue, SingleValue } from 'react-select';

export type TableProps<T = any> = TableOptions<T> & {
  emptyListComponent?: React.ReactNode;
  enableCustomRowClasses?: boolean;
  isEmptySearchResults?: boolean;
  isLoading?: boolean;
  scrollToRowId?: number | null;
  paginationProps: {
    pageIndex: number;
    pageSize: number;
  };
  rowIdentifier?: string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  tableHeaderOptions?: React.ReactNode;
  onMouseClick?: (
    e: React.MouseEvent<HTMLTableRowElement>,
    row: RowModel<Row<T>>,
  ) => void;
  onPageSizeChange: (
    option:
      | MultiValue<SelectOption<number>>
      | SingleValue<SelectOption<number>>,
  ) => void;
  rowClassesGenerator?: (row: RowModel<Row<T>>) => string;
};

export type InitialTableStateType<Type> = {
  page: number;
  data: Type[];
  sizePerPage: number;
  totalSize: number;
};
