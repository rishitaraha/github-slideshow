import { SelectOption } from '../../molecules';

export const pageSizeOptions: SelectOption<number>[] = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

export const paginationInitialState = {
  pageIndex: 0,
  pageSize: 25,
};
