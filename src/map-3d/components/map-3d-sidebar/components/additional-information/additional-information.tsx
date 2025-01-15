import {
  Accordion,
  AccordionVariant,
  Button,
  Icon,
  IconIdentifier,
  Placement,
} from '@aus-platform/design-system';
import { isEmpty, isNil, sortBy, uniqBy, values } from 'lodash';
import { useContext, useMemo } from 'react';
import { map3dSidebarItems } from '../../constants';
import { DatasetDetailsTooltip } from '../map-3d-workspace/shared/components';
import {
  selectMap3dDataset,
  selectMap3dWorkspace,
} from 'map-3d/shared/map-3d-slices';
import { Map3DSideBarContext } from 'map-3d/contexts';
import { useAppSelector } from 'app/hooks';

const AdditionalInfoAccordionTitle: React.FC<{
  site: string;
  iteration: string;
}> = ({ site, iteration }) => {
  return (
    <DatasetDetailsTooltip
      siteName={site}
      iterationName={iteration}
      placement={Placement.Auto}
    >
      <div className="additional-information__accordion-title">
        <div className="additional-information__accordion-title__site">
          {site}
        </div>
        <Icon identifier={IconIdentifier.ChevronSmallRight} size={16} />
        <div className="additional-information__accordion-title__iteration">
          {iteration}
        </div>
      </div>
    </DatasetDetailsTooltip>
  );
};

export const AdditionalInformation: React.FC = () => {
  // Contexts.
  const { activeOptionHandler } = useContext(Map3DSideBarContext);

  // Selectors.
  const { selectedProject } = useAppSelector(selectMap3dDataset);
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);

  // Memos.
  const iterationInfoList = useMemo(() => {
    const infoList = values(workspaceLayers).map(({ iteration, site }) => {
      return {
        iteration: {
          id: iteration.id,
          name: iteration.name,
          info: iteration.info,
        },
        site: site.name,
      };
    });

    const uniqueIterations = sortBy(uniqBy(infoList, 'iteration.id'), [
      'site',
      'iteration.name',
    ]);

    return uniqueIterations;
  }, [workspaceLayers]);

  // Handlers.
  const onClickSelectProject = () => {
    activeOptionHandler(
      map3dSidebarItems[0],
      map3dSidebarItems[0].icon.identifier,
    );
  };

  if (isNil(selectedProject)) {
    return (
      <div className="additional-information--empty-project">
        <span className="additional-information__empty-text">
          No project selected
        </span>
        <Button onClick={onClickSelectProject}>Select Project</Button>
      </div>
    );
  } else if (isEmpty(workspaceLayers)) {
    return (
      <div className="additional-information--empty-workspace">
        <div className="additional-information__empty-text">
          Add layers to Workspace to view Additional Information
        </div>
      </div>
    );
  } else {
    return (
      <div className="additional-information">
        <Accordion variant={AccordionVariant.ChevronRight}>
          {iterationInfoList.map(({ iteration, site }, index) => {
            return (
              <Accordion.Item
                title={
                  <AdditionalInfoAccordionTitle
                    site={site}
                    iteration={iteration.name}
                  />
                }
                eventKey={`iteration-additional-info-accoridon-${index}`}
                key={index}
              >
                {isNil(iteration.info) || isEmpty(iteration.info) ? (
                  <div className="additional-information__empty-text">
                    No Additional Information added for this Iteration
                  </div>
                ) : (
                  <div
                    className="additional-information__iteration-info"
                    dangerouslySetInnerHTML={{
                      __html: iteration.info,
                    }}
                  ></div>
                )}
              </Accordion.Item>
            );
          })}
        </Accordion>
      </div>
    );
  }
};
