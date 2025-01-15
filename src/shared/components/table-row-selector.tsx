import { Input } from '@aus-platform/design-system';

export const tableRowSelectColumn = {
  id: 'selection',
  maxSize: 1,
  style: {},
  header: ({ table }) => {
    return (
      <Input.CheckBox
        {...{
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          onChange: table.getToggleAllPageRowsSelectedHandler(),
        }}
      />
    );
  },
  cell: ({ row }) => {
    return (
      <Input.CheckBox
        {...{
          checked: row.getIsSelected(),
          indeterminate: row.getIsSomeSelected(),
          onChange: row.getToggleSelectedHandler(),
        }}
      />
    );
  },
};
