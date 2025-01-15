import { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper, getCoreRowModel } from '@tanstack/react-table';
import { Table } from './table';
import { useArgs } from '@storybook/preview-api';
import { TableProps } from './types';

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

const defaultData: Person[] = [
  {
    firstName: 'tanner',
    lastName: 'linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'tandy',
    lastName: 'miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'joe',
    lastName: 'dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
  {
    firstName: 'tanner',
    lastName: 'linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'tandy',
    lastName: 'miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'joe',
    lastName: 'dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
  {
    firstName: 'tanner',
    lastName: 'linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'tandy',
    lastName: 'miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'joe',
    lastName: 'dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
];

const columnHelper = createColumnHelper<Person>();

const columns = [
  {
    id: 'fullName',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: 'Full Name',
  },
  columnHelper.accessor('firstName', {
    cell: (info) => info.getValue(),
    header: 'First Name',
  }),
];

const meta: Meta<typeof Table> = {
  title: 'Organisms/Table',
  component: Table,
  args: {
    isLoading: false,
    data: defaultData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    paginationProps: { pageIndex: 0, pageSize: 5 },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const TableStory: React.FC<Story & TableProps> = () => {
  const [storyArgs, updateArgs] = useArgs<TableProps>();
  const pageChangeHandler = (option) => {
    updateArgs({
      paginationProps: {
        pageSize: option.value,
        pageIndex: 0,
      },
    });
  };
  return (
    <Table
      {...storyArgs}
      onPaginationChange={({ pageIndex, pageSize }: any) => {
        updateArgs({ paginationProps: { pageIndex, pageSize } });
      }}
      onPageSizeChange={pageChangeHandler}
    />
  );
};
