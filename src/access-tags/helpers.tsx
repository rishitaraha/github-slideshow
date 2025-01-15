import {
  Button,
  ButtonVariant,
  IconIdentifier,
  Pill,
  PillShape,
  PillVariant,
} from '@aus-platform/design-system';
import {
  CellContext,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table';
import { AccessTagObj } from '../shared/api/access-tags';
import { dateFormatter } from '../shared/helpers';

const columnHelper = createColumnHelper<AccessTagObj>();

export const accessTagListColumns = (
  onEditAccessTagClick: (accessTag: AccessTagObj) => void,
  onDeleteAccessTagClick: (accessTag: AccessTagObj) => void,
): ColumnDef<AccessTagObj, any>[] => {
  return [
    columnHelper.accessor('name', {
      size: 350,
      header: 'ACCESS TAG NAME',
      cell: (info: CellContext<AccessTagObj, any>) => (
        <Pill shape={PillShape.Oval} color={info.row.original.color}>
          {info.getValue()}
        </Pill>
      ),
    }),
    columnHelper.accessor('userGroupsCount', {
      size: 343,
      header: 'TAGGED ENTITIES',
      cell: (info: CellContext<AccessTagObj, any>) => {
        return (
          <Pill
            className="access-tags-list__td access-tags-list__td--user-group-count"
            variant={PillVariant.Info}
          >
            {info.getValue()} User Groups
          </Pill>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      size: 343,
      header: 'DATE CREATED',
      cell: (info: CellContext<AccessTagObj, any>) => {
        const [dateCreated] = dateFormatter(new Date(info.getValue()))
          .toString()
          .replaceAll('-', ' ')
          .split(',');
        return <div>{dateCreated}</div>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info: CellContext<AccessTagObj, any>) => {
        return (
          <div className="access-tags-list__action-item-box aus-table__action__buttons">
            <Button
              className="access-tags-list__action-item__edit-button"
              leftIconIdentifier={IconIdentifier.Pencil}
              variant={ButtonVariant.Secondary}
              iconSize={18}
              onClick={() => onEditAccessTagClick(info.row.original)}
            ></Button>

            <Button
              className="access-tags-list__action-item__delete-button"
              leftIconIdentifier={IconIdentifier.Bin}
              variant={ButtonVariant.Secondary}
              iconSize={18}
              onClick={() => onDeleteAccessTagClick(info.row.original)}
            ></Button>
          </div>
        );
      },
    }),
  ];
};
