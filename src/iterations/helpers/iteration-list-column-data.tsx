import {
  Button,
  ButtonVariant,
  IconIdentifier,
  StatusIndicator,
  StatusIndicatorLevel,
  Tooltip,
} from '@aus-platform/design-system';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import React from 'react';
import { CurrentIteration, IterationListItem, LoggedUser } from 'shared/api';
import { BatchJobStatus } from 'shared/enums';
import { getFileStatusText, isOrgAdmin } from 'shared/helpers';
import { DateTimeFormatLength } from 'shared/utils/enums';

type IterationListColumnsParams = {
  canManageIterations: boolean;
  setCurrentIteration: React.Dispatch<React.SetStateAction<CurrentIteration>>;
  onClickEditIteration: VoidFunction;
  onClickDeleteIteration: VoidFunction;
  loggedUser?: LoggedUser;
};

const columnHelper = createColumnHelper<IterationListItem>();

export const iterationListColumns = ({
  canManageIterations,
  setCurrentIteration,
  onClickEditIteration,
  onClickDeleteIteration,
  loggedUser,
}: IterationListColumnsParams): ColumnDef<IterationListItem, any>[] => {
  // Handlers.
  const editIteration = (iterationId: string, iterationName: string) => {
    setCurrentIteration({ iterationId, iterationName });
    onClickEditIteration();
  };

  const deleteIteration = (iterationId: string, iterationName: string) => {
    setCurrentIteration({
      iterationId,
      iterationName,
    });
    onClickDeleteIteration();
  };

  return [
    columnHelper.accessor('name', {
      size: 350,
      header: 'ITERATION NAME',
      cell: (info) => <div>{info.getValue()}</div>,
    }),
    columnHelper.accessor('date', {
      size: 515,
      header: 'DATE CREATED',
      cell: (info) => {
        const dateCreated = info
          .getValue()
          .formatDate(DateTimeFormatLength.Medium, ' ');
        return <div>{dateCreated}</div>;
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info) => {
        const iteration: IterationListItem = info.row.original;

        // TODO: refactor after design updates.
        let dsmStatus;
        if (iteration.capturedDsm?.status !== StatusIndicatorLevel.Done) {
          dsmStatus = iteration.capturedDsm?.status;
        } else if (
          iteration.capturedDsmCog?.batchJob.status ===
            BatchJobStatus.Started ||
          iteration.capturedDsmCog?.batchJob.status ===
            BatchJobStatus.Processing ||
          iteration.capturedDsmCog?.batchJob.status === BatchJobStatus.Failed
        ) {
          dsmStatus = iteration.capturedDsmCog.batchJob.status;
        } else if (iteration.terrainTiles?.status) {
          dsmStatus = iteration.terrainTiles.status;
        }

        return (
          <div className="iteration-list__action aus-table__action__buttons">
            <div
              className="iteration-list__status_icons aus-table__action__buttons"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* TODO: Remove the captureDSM status check from this code once the DSM cog status design is implemented. */}
              {dsmStatus &&
                iteration.capturedDsm?.status !==
                  StatusIndicatorLevel.Deleted && (
                  <Tooltip hoverText={getFileStatusText('DSM', dsmStatus)}>
                    <StatusIndicator
                      iconIdentifier={IconIdentifier.DSM}
                      status={dsmStatus}
                    />
                  </Tooltip>
                )}
            </div>

            <div className="iteration-list__action-item__button-container">
              {canManageIterations && (
                <Button
                  className="iteration-list__action-item__button--edit"
                  variant={ButtonVariant.Secondary}
                  leftIconIdentifier={IconIdentifier.Pencil}
                  iconSize={18}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    editIteration(info.row.original.id, info.row.original.name);
                  }}
                  data-testid="edit-iteration-btn"
                />
              )}
              {isOrgAdmin(loggedUser) && (
                <Button
                  className="iteration-list__action-item__button--delete"
                  variant={ButtonVariant.Secondary}
                  leftIconIdentifier={IconIdentifier.Bin}
                  iconSize={18}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    deleteIteration(
                      info.row.original.id,
                      info.row.original.name,
                    );
                  }}
                  data-testid="remove-iteration-btn"
                />
              )}
            </div>
          </div>
        );
      },
    }),
  ];
};
