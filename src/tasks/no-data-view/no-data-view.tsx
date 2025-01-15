import { FC } from 'react';
import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import { NoDataViewProps } from '../types';
import { noDataViewText } from '../constants';

export const NoDataView: FC<NoDataViewProps> = ({ resourceName, onClick }) => (
  <div className="no-data-view__details">
    <Icon
      size={114}
      identifier={IconIdentifier.InfoCircle}
      colorClass={ColorClass.Neutral200}
    />
    <span className="no-data-view__header">
      {noDataViewText[resourceName].heading}
    </span>
    <span className="no-data-view__subtitle">
      {noDataViewText[resourceName].subHeading}
    </span>
    <Button
      className="no-data-view__btn"
      variant={ButtonVariant.Primary}
      leftIconIdentifier={noDataViewText[resourceName].btnIcon}
      onClick={onClick}
    >
      {noDataViewText[resourceName].btnText}
    </Button>
  </div>
);
