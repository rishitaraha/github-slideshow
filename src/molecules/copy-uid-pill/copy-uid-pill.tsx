import React, { useState } from 'react';
import { Tooltip, Icon, Pill, PillVariant } from '../../atoms';
import { ColorClass, IconIdentifier } from '../../enums';
import { CopyUidPillProps } from './types';
import { copyUidOnClick, generateUid } from './uid-helpers';

export const CopyUidPillComponent: React.FC<CopyUidPillProps> = ({
  serialId,
  uidType,
  prefixText,
}) => {
  const [copied, setCopied] = useState(false);

  const copyUidClickHandler = (event: React.MouseEvent<HTMLElement>) => {
    copyUidOnClick(serialId, uidType);
    setCopied(true);
    event.preventDefault();
    event.stopPropagation();
  };
  const onMouseLeaveHandler = () =>
    setTimeout(() => {
      setCopied(false);
    }, 100);

  return (
    <div className="copy-uid-pill">
      {prefixText && <div>{prefixText}</div>}
      <Pill
        className="gap-4"
        variant={copied ? PillVariant.Active : PillVariant.Unique}
        color={ColorClass.Primary200}
      >
        <div>{generateUid(serialId, uidType)}</div>
        <div>
          <Tooltip activeState={copied}>
            <div onMouseLeave={onMouseLeaveHandler}>
              <Icon
                className={'copy-uid-pill__icon'}
                identifier={IconIdentifier.Copy}
                onClick={copyUidClickHandler}
                size={11}
              />
            </div>
          </Tooltip>
        </div>
      </Pill>
    </div>
  );
};
