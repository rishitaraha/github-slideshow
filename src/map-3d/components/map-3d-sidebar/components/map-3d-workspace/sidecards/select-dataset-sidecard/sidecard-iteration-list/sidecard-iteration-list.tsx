import {
  ColorClass,
  Icon,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { ListItem } from '../../../../../shared/components/list-item';
import { filterListBySearchQuery } from '../helpers';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  selectMap3dDataset,
  setActiveWorkspaceIteration,
  setCanManageIterationsAndLayers,
} from 'map-3d/shared/map-3d-slices';
import { IterationListItem, useIterationsList } from 'shared/api';
import { DateTimeFormatLength } from 'shared/utils/enums';

type SidecardIterationListProps = {
  searchQuery?: string;
};

export const SidecardIterationList: React.FC<SidecardIterationListProps> = ({
  searchQuery,
}) => {
  // Dispatcher.
  const dispatch = useAppDispatch();

  // Selectors.
  const { activeWorkspaceSite } = useAppSelector(selectMap3dDataset);

  // States.
  const [filteredIterationList, setFilteredIterationList] =
    useState<IterationListItem[]>();

  // Apis.
  const {
    data: iterationListResponse,
    isSuccess: isSuccessIterationList,
    isLoading: isLoadingIterationList,
  } = useIterationsList(
    {
      siteId: activeWorkspaceSite?.id ?? null,
    },
    !isNil(activeWorkspaceSite),
  );

  // useEffects.
  useEffect(() => {
    if (isSuccessIterationList && iterationListResponse) {
      const filteredList = filterListBySearchQuery(
        searchQuery,
        iterationListResponse.list,
      );

      setFilteredIterationList(filteredList);
      dispatch(
        setCanManageIterationsAndLayers(
          iterationListResponse.canManageIterations,
        ),
      );
    }
  }, [searchQuery, iterationListResponse, isSuccessIterationList]);

  // Handlers.
  const onSelectIteration = (iteration: IterationListItem) => {
    dispatch(setActiveWorkspaceIteration(iteration));
  };

  if (isLoadingIterationList) {
    return <Spinner />;
  } else if (
    isNil(filteredIterationList) ||
    filteredIterationList.length === 0
  ) {
    return (
      <div className="workspace-empty-list">No iterations to display.</div>
    );
  } else {
    return (
      <>
        {filteredIterationList.map((iteration) => {
          const { id, name, date } = iteration;

          return (
            <ListItem
              key={id}
              onClick={() => {
                onSelectIteration(iteration);
              }}
              className="sidecard-iteration-list__item"
            >
              <ListItem.Avatar>
                <Icon identifier={IconIdentifier.IterationTypeDefault} />
              </ListItem.Avatar>
              <ListItem.Content className="sidecard-iteration-list__content">
                <div className="sidecard-iteration-list__content__heading">
                  {name}
                </div>
                <div className="sidecard-iteration-list__content__sub-heading">
                  Survey Date:{' '}
                  {date?.formatDate(DateTimeFormatLength.Medium, ' ')}
                </div>
              </ListItem.Content>
              <ListItem.Action className="sidecard-iteration-list__action">
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
