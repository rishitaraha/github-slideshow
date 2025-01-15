import { isEmpty, isNil } from 'lodash';
import { getCesiumScalePrintStyle } from '../../helpers';
import { useMyOrg } from 'shared/api';
import { CustomDate } from 'shared/utils';
import { DateTimeFormatLength } from 'shared/utils/enums';
import { useAppSelector } from 'src/app/hooks';
import { Image } from 'src/assets';
import { selectMap3dDataset } from 'map-3d/shared/map-3d-slices';

type PrintHeaderProps = {
  reportTitle: string;
};

export const PrintHeader: React.FC<PrintHeaderProps> = ({ reportTitle }) => {
  // Selectors.
  const { selectedProject, selectedTerrainIteration, selectedTerrainSite } =
    useAppSelector(selectMap3dDataset);
  const generatedTime = new CustomDate(Date.now()).formatDateTime(
    DateTimeFormatLength.Long,
    DateTimeFormatLength.Medium,
  );

  // Apis.
  const { data: myOrgResponse } = useMyOrg();

  return (
    <div className="print-header">
      <style>{getCesiumScalePrintStyle()}</style>
      <div className="print-header--main">
        <div className="print-header__report-title">{reportTitle}</div>
        <div className="print-header__captured-time">
          <span className="print-header__captured-time__header">
            Generated on
          </span>
          <span>{generatedTime}</span>
        </div>
      </div>
      <div className="print-header--sub">
        <div className="print-header__org">
          <img
            src={
              isEmpty(myOrgResponse?.data.logo) ||
              isNil(myOrgResponse?.data.logo)
                ? Image.DefaultOrgLogo
                : myOrgResponse?.data.logo
            }
            className="print-header__org__logo"
          />
          <span className="print-header__org__name">
            {myOrgResponse?.data.name}
          </span>
        </div>
        <div className="print-header__dataset--project">
          <div className="print-header__dataset__sub-header">Project</div>
          <div className="print-header__dataset__value">
            {selectedProject?.name}
          </div>
        </div>
        <div className="print-header__dataset--site">
          <div className="print-header__dataset__sub-header">Site</div>
          <div className="print-header__dataset__value">
            {selectedTerrainSite?.name}
          </div>
        </div>
        <div className="print-header__dataset--iteration">
          <div className="print-header__dataset__sub-header">Iteration</div>
          <div className="print-header__dataset__value">
            {!isEmpty(selectedTerrainIteration?.name) && (
              <>
                <span className="iteration-name">
                  {selectedTerrainIteration?.name}{' '}
                </span>
                <span className="iteration-date">
                  Survey Date:{' '}
                  {selectedTerrainIteration?.date?.formatDate(
                    DateTimeFormatLength.Long,
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
