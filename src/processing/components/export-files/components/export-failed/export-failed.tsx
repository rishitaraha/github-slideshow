import { ColorClass, Icon, IconIdentifier } from '@aus-platform/design-system';

export const ExportFailed = () => {
  return (
    <div className="export-files-status">
      <Icon
        identifier={IconIdentifier.ExclamationCircle}
        size={106}
        colorClass={ColorClass.Red500}
        className="export-files-status__img-failed"
      />
      <h2 className="export-files-status__heading">Export failed</h2>
      <span className="export-files-status__text">
        Something went wrong. Try exporting again
      </span>
    </div>
  );
};
