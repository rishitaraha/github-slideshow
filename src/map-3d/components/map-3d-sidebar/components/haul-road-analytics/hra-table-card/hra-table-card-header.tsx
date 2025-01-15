import { ColorClass, Icon, IconIdentifier } from '@aus-platform/design-system';
import FileSaver from 'file-saver';
import React, { useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useDownloadHaulRoadAttributes } from 'shared/api';

type HRATableCardHeaderProps = {
  onClose: VoidFunction;
  haulRoadId: string;
  haulRoadName: string;
};

export const HRATableCardHeader: React.FC<HRATableCardHeaderProps> = ({
  onClose,
  haulRoadId,
  haulRoadName,
}) => {
  const {
    mutate: sendDownloadHaulRoadAttributes,
    data: downloadTableResponse,
    isSuccess: isSuccessDownloadTable,
  } = useDownloadHaulRoadAttributes();

  useEffect(() => {
    if (downloadTableResponse && isSuccessDownloadTable) {
      FileSaver.saveAs(
        downloadTableResponse,
        `${haulRoadName}_haul_road_report.csv`,
      );
    }
  }, [downloadTableResponse, isSuccessDownloadTable]);
  return (
    <Card.Header className="hra-table-card__header">
      <span className="hra-table-card__header__text">
        Haul Road Gradient & Width Analysis
      </span>
      <div className="hra-table-card__header__icon-container">
        <Icon
          identifier={IconIdentifier.Download}
          onClick={() => sendDownloadHaulRoadAttributes(haulRoadId)}
          colorClass={ColorClass.Neutral300}
          cursor={true}
          className="hra-table-card__header__icon-container__icon"
        />
        <Icon
          identifier={IconIdentifier.Cross}
          onClick={onClose}
          colorClass={ColorClass.Neutral300}
          cursor={true}
          className="hra-table-card__header__icon-container__icon"
        />
      </div>
    </Card.Header>
  );
};
