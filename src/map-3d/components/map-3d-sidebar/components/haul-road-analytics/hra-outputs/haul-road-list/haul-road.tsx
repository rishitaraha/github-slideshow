import { ColorClass, Icon, IconIdentifier } from '@aus-platform/design-system';
import { ListItem } from 'map-3d/components/map-3d-sidebar/shared';
import { HaulRoadListItem } from 'src/shared/api';

type HaulRoadProps = {
  haulRoad: HaulRoadListItem;
  onClick: (haulRoad: HaulRoadListItem) => void;
  onClickDeleteHaulRoad: (id: string) => void;
};

export const HaulRoad: React.FC<HaulRoadProps> = ({
  haulRoad,
  onClick,
  onClickDeleteHaulRoad,
}) => {
  return (
    <>
      <ListItem
        className="haul-road-list-item"
        onClick={() => onClick(haulRoad)}
      >
        <ListItem.Avatar>
          <div>
            {/* <StatusIndicator
            iconIdentifier={IconIdentifier.RoadAnalytics}
            iconColorClass={ColorClass.AccentSuccess200}
            status={StatusIndicatorLevel.Completed}
            iconSize={22}
          /> */}

            <Icon
              identifier={IconIdentifier.RoadAnalytics}
              colorClass={ColorClass.Primary500}
              size={22}
            />
          </div>
        </ListItem.Avatar>
        <ListItem.Content>
          <div>{haulRoad.name}</div>
        </ListItem.Content>
        <ListItem.Action>
          <Icon
            identifier={IconIdentifier.Bin}
            size={18}
            className="delete-icon"
            onClick={(event) => {
              event.stopPropagation();
              onClickDeleteHaulRoad(haulRoad.id);
            }}
          />
        </ListItem.Action>
      </ListItem>
    </>
  );
};
