import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Pill,
  PillVariant,
  Tooltip,
} from '@aus-platform/design-system';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { useContext } from 'react';
import { User } from '../shared/api';
import { GlobalContext } from '../shared/context';
import { dateFormatter, isOrgAdmin } from '../shared/helpers';

const columnHelper = createColumnHelper<User>();

export const UserListColumns = (editUser): ColumnDef<User, any>[] => {
  const { loggedUser } = useContext(GlobalContext);

  return [
    {
      accessorKey: 'firstName',
      size: 500,
      enableResizing: true,
      cell: (info) => (
        <div className="user-list__name">
          <span>
            {info.row.original.firstName} {info.row.original.lastName}
          </span>
          {info.row.original.email === loggedUser?.email && (
            <span className="user-list__name__logged-user-badge">(you)</span>
          )}
          {isOrgAdmin(info.row.original) && (
            <Tooltip hoverText="Org Admin">
              <Icon
                identifier={IconIdentifier.Admin}
                size={18}
                colorClass={ColorClass.Primary500}
              />
            </Tooltip>
          )}
          {!info.row.original.isActive && (
            <Pill
              variant={PillVariant.Info}
              className="user-list__name__deactivated-user-pill"
            >
              Deactivated
            </Pill>
          )}
        </div>
      ),
      header: () => <span>Name</span>,
    },

    columnHelper.accessor('email', {
      size: 500,
      cell: (info) => info.getValue(),
      header: 'Email',
    }),
    columnHelper.accessor('lastLogin', {
      size: 500,
      cell: (info) => {
        if (info.getValue()) {
          const [lastLoginDate, lastLoginTime] = dateFormatter(info.getValue())
            .toString()
            .replaceAll('-', ' ')
            .split(',');
          return (
            <>
              {lastLoginDate}{' '}
              <span className="user-list__time">{lastLoginTime}</span>
            </>
          );
        }

        return (
          <span className="user-list__not-loggedin">Not logged in yet</span>
        );
      },
      header: 'Last Login',
    }),
    columnHelper.display({
      id: 'actions',
      cell: (props) => {
        return (
          <div className="user-list__action-btns aus-table__action__buttons">
            <Button
              className="user-list__action-btns__edit-btn"
              onClick={() => editUser(props.row.original.id)}
              leftIconIdentifier={IconIdentifier.Pencil}
              variant={ButtonVariant.Secondary}
              iconSize={18}
            ></Button>
          </div>
        );
      },
      header: () => <div className="aus-table__action__header">Actions</div>,
    }),
  ];
};
