import {
  ColorClass,
  Icon,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { filterListBySearchQuery } from '../helpers';
import { ListItem } from '../../../../../shared/components/list-item';
import { SiteListItem, useSiteList } from 'shared/api';
import { DateTimeFormatLength } from 'shared/utils/enums';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  selectMap3dDataset,
  setActiveWorkspaceSite,
  setCanManageIterationsAndLayers,
} from 'map-3d/shared/map-3d-slices';

type SidecardSiteListProps = {
  searchQuery?: string;
};

export const SidecardSiteList: React.FC<SidecardSiteListProps> = ({
  searchQuery,
}) => {
  // Dispatcher.
  const dispatch = useAppDispatch();

  // Selectors.
  const { selectedProject } = useAppSelector(selectMap3dDataset);

  // States.
  const [filteredSiteList, setFilteredSiteList] = useState<SiteListItem[]>();

  // Apis.
  const {
    data: siteListResponse,
    isSuccess: isSuccessSiteList,
    isLoading: isLoadingSiteList,
  } = useSiteList(
    {
      projectId: selectedProject?.id ?? '',
      excludeFields: ['boundary', 'type'],
    },
    !isNil(selectedProject),
  );

  // useEffects.
  useEffect(() => {
    if (isSuccessSiteList && siteListResponse) {
      const canManageIterationsAndLayers = siteListResponse.list.some(
        ({ canManageIterationsAndLayers }) => canManageIterationsAndLayers,
      );

      const filteredList = filterListBySearchQuery(
        searchQuery,
        siteListResponse.list,
      );

      setFilteredSiteList(filteredList);
      dispatch(setCanManageIterationsAndLayers(canManageIterationsAndLayers));
    }
  }, [siteListResponse, isSuccessSiteList, searchQuery]);

  // Handlers.
  const onSelectSite = (site) => {
    dispatch(setActiveWorkspaceSite(site));
  };

  if (isLoadingSiteList) {
    return <Spinner />;
  } else if (isNil(filteredSiteList) || filteredSiteList.length === 0) {
    return <div className="workspace-empty-list">No sites to display.</div>;
  } else {
    return (
      <>
        {filteredSiteList.map((site) => {
          const { id, name, createdAt } = site;

          return (
            <ListItem
              key={id}
              onClick={() => {
                onSelectSite(site);
              }}
              className="sidecard-site-list__item"
            >
              <ListItem.Avatar>
                <Icon identifier={IconIdentifier.SiteTypeMine} />
              </ListItem.Avatar>
              <ListItem.Content className="sidecard-site-list__content">
                {' '}
                <div className="sidecard-site-list__content__heading">
                  {name}
                </div>
                <div className="sidecard-site-list__content__sub-heading">
                  Created:{' '}
                  {createdAt?.formatDate(DateTimeFormatLength.Medium, ' ')}
                </div>
              </ListItem.Content>
              <ListItem.Action className="sidecard-site-list__action">
                <Icon
                  identifier={IconIdentifier.ChevronSmallRight}
                  colorClass={ColorClass.Neutral200}
                  size={14}
                />
              </ListItem.Action>
            </ListItem>
          );
        })}
      </>
    );
  }
};
