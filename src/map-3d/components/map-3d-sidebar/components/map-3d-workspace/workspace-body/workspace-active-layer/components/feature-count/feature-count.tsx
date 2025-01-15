import {
  Icon,
  IconIdentifier,
  IndentedTree,
} from '@aus-platform/design-system';
import { entries } from 'lodash';
import { FeatureGeometryType, FeaturesCount } from 'shared/api';

const FeatureTypeLabel = {
  [FeatureGeometryType.Line]: 'Line',
  [FeatureGeometryType.Point]: 'Point',
  [FeatureGeometryType.Polygon]: 'Polygon',
  [FeatureGeometryType.Textbox]: 'Textbox',
};

export const FeatureCountTree: React.FC<{
  featuresCount: FeaturesCount | undefined;
  visible: boolean;
}> = ({ featuresCount, visible }) => {
  return (
    <IndentedTree visible={visible}>
      {entries(featuresCount).map(([feature, count]) => {
        return (
          <div className="feature-count-item" key={feature}>
            <Icon
              identifier={IconIdentifier[FeatureTypeLabel[feature]]}
              className="feature-count__icon"
            />
            <div className="feature-count__content">
              <div>{FeatureTypeLabel[feature]}</div>
              <div>{count} item(s)</div>
            </div>
          </div>
        );
      })}
    </IndentedTree>
  );
};
