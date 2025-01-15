import {
  Button,
  ButtonVariant,
  IconIdentifier,
} from '@aus-platform/design-system';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { SiteListItem } from '../../shared/api';
import { Formatter } from '../../shared/helpers';

const columnHelper = createColumnHelper<SiteListItem>();

export const siteListColumns = (
  setCurrentSite: ({
    siteId,
    siteName,
  }: {
    siteId: string;
    siteName: string;
  }) => void,
  onClickDeleteSite: () => void,
  setShowEditSiteFunc: () => void,
  navigate: any,
  isAdminUser: boolean,
  canManageSites: boolean | undefined,
): ColumnDef<SiteListItem, any>[] => {
  // Handlers.
  const deleteSite = (id: string, name: string) => {
    setCurrentSite({ siteId: id, siteName: name });
    onClickDeleteSite();
  };

  const editSite = (id: string, name: string) => {
    setCurrentSite({ siteId: id, siteName: name });
    setShowEditSiteFunc();
  };

  const goToIteration = (id: string) => {
    navigate(`/iterations` + `?siteId=${id}`);
  };

  return [
    columnHelper.accessor('name', {
      size: 500,
      header: 'SITE NAME',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('type', {
      size: 500,
      header: 'SITE TYPE',
      cell: (info) => Formatter.toTitleCase(info.getValue(), '_'),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="aus-table__action__header">Actions</div>,
      cell: (info) => {
        return (
          <div className="site-list__action aus-table__action__buttons">
            <Button
              className=" site-list__action-item__iteration-button"
              onClick={() => goToIteration(info.row.original.id)}
              leftIconIdentifier={IconIdentifier.Iteration}
              variant={ButtonVariant.Secondary}
              data-testid="test-site-list-iteration-button"
            >
              Iterations
            </Button>

            {(isAdminUser || canManageSites) && (
              <Button
                className="site-list__action site-list__action-item__edit-button"
                variant={ButtonVariant.Secondary}
                leftIconIdentifier={IconIdentifier.Pencil}
                iconSize={18}
                onClick={() =>
                  editSite(info.row.original.id, info.row.original.name)
                }
                data-testid="test-edit-site-button"
              />
            )}

            {isAdminUser && (
              <Button
                className="site-list__action site-list__action-item__delete-button"
                variant={ButtonVariant.Secondary}
                leftIconIdentifier={IconIdentifier.Bin}
                iconSize={18}
                onClick={() =>
                  deleteSite(info.row.original.id, info.row.original.name)
                }
              />
            )}
          </div>
        );
      },
    }),
  ];
};
