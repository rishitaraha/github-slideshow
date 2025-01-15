import {
  Button,
  ButtonVariant,
  IconIdentifier,
} from '@aus-platform/design-system';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { UserGroupItem } from '../shared/api';

const columnHelper = createColumnHelper<UserGroupItem>();

export const userGroupListColumns = (
  editUserGroup,
): ColumnDef<UserGroupItem, any>[] => {
  return [
    columnHelper.accessor('name', {
      header: 'GROUP NAME',
      cell: (info) => {
        return (
          <div className="user-group-list__name">
            <span>{info.getValue()}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('membersCount', {
      header: 'NUMBER OF MEMBERS',
      cell: (info) => {
        return (
          <div className="user-group-list__members-count">
            <span>{info.getValue()} members</span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info) => {
        return (
          <div className="user-group-list__action-btns aus-table__action__buttons">
            <Button
              className="user-group-list__action-btns__edit-btn"
              onClick={() => editUserGroup(info.row.original.id)}
              leftIconIdentifier={IconIdentifier.Pencil}
              variant={ButtonVariant.Secondary}
              iconSize={18}
            ></Button>
          </div>
        );
      },
    }),
  ];
};
