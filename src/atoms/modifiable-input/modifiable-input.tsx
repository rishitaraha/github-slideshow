import React, { MutableRefObject, useCallback, useState } from 'react';

import { Icon } from '../icon';
import { ColorClass, IconIdentifier } from '../../enums';
import AutosizeInput from 'react-input-autosize';

type ModifiableInputProps = {
  text: string;
  onClick?: () => void;
  onCancel?: () => void;
  handleChange?: (e: string | null) => void;
  onSubmit?: (event: Event) => void;
};

export const ModifiableInput = React.forwardRef<
  HTMLInputElement | null,
  ModifiableInputProps
>(({ text, onClick, handleChange, onCancel, onSubmit }, ref) => {
  const [renameInputState, setRenameInputState] = useState<boolean>(false);

  const setInputRef = useCallback((inputElement: HTMLInputElement | null) => {
    if (ref !== null) {
      (ref as MutableRefObject<HTMLInputElement | null>).current = inputElement;
    }
  }, []);

  const changeRenameInputState = (cancel: boolean) => {
    onClick?.();
    setRenameInputState(!renameInputState);
    if (cancel) {
      onCancel?.();
    }
  };

  const handleSubmit = (e: Event) => {
    setRenameInputState(!renameInputState);
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div className="modifiable-input">
      {renameInputState ? (
        <AutosizeInput
          inputClassName="modifiable-input-box-enabled"
          value={text}
          onChange={(e) => handleChange?.(e.target.value)}
          inputStyle={{
            minWidth: '5ch',
            fontSize: '28px',
            fontStyle: 'normal',
            fontWeight: 'bold',
            lineHeight: '38px',
          }}
          inputRef={setInputRef}
        />
      ) : (
        <span> {text} </span>
      )}
      {renameInputState ? (
        <>
          <Icon
            identifier={IconIdentifier.CheckSquareFill}
            colorClass={ColorClass.Primary500}
            onClick={handleSubmit}
            className="ms-3 cursor-pointer"
          />
          <Icon
            identifier={IconIdentifier.CloseSquare}
            colorClass={ColorClass.Primary500}
            onClick={() => changeRenameInputState(true)}
            className="ms-2 cursor-pointer"
          />
        </>
      ) : (
        <Icon
          size={14}
          identifier={IconIdentifier.Pencil}
          colorClass={ColorClass.Primary500}
          onClick={() => changeRenameInputState(false)}
          className="ms-3 cursor-pointer"
        />
      )}
    </div>
  );
});
