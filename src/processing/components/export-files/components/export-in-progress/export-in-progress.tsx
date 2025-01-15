import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import { useNavigate } from 'react-router-dom';

export type ExportInProgressProps = {
  siteId?: string;
};

export const ExportInProgress: React.FC<ExportInProgressProps> = ({
  siteId,
}) => {
  // Hooks.
  const navigate = useNavigate();

  // Handlers.
  const onIterationsBtnClick = () => {
    navigate(`/iterations` + `?siteId=${siteId}`);
  };

  return (
    <div className="export-files-status">
      <Icon
        identifier={IconIdentifier.ImportExportProcessing}
        size={106}
        colorClass={ColorClass.AccentWarning}
        className="export-files-status__img-progress"
      />
      <h2 className="export-files-status__heading">Export processing</h2>
      <span className="export-files-status__text">
        Visit Iterations page to check latest status
      </span>
      <Button
        className="export-files-status__btn"
        variant={ButtonVariant.Secondary}
        onClick={onIterationsBtnClick}
      >
        Go to Iterations
      </Button>
    </div>
  );
};
