import React from 'react';
import { ColorClass, Icon, IconIdentifier } from '@aus-platform/design-system';

type EmptyListProps = {
  iconIdentifier?: IconIdentifier;
  headingText?: string;
  addButton?: React.ReactNode;
  bodyText?: string;
};

export const EmptyList: React.FC<EmptyListProps> = ({
  iconIdentifier = IconIdentifier.ClipBoardOff,
  headingText,
  bodyText = 'Do you want to add one?',
  addButton,
}) => {
  return (
    <div className="empty-list">
      <Icon
        identifier={iconIdentifier}
        colorClass={ColorClass.Neutral200}
        size={114}
      />
      <div className="empty-list__heading"> {headingText}</div>
      <div className="empty-list__body">{bodyText}</div>
      <div className="empty-list__add-button">{addButton}</div>
    </div>
  );
};
