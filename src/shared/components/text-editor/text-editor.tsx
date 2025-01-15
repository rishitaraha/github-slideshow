import { Input } from '@aus-platform/design-system';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import React from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';

type TextEditorProps = ReactQuillProps & {
  error?: string;
  disabled?: boolean;
};

export const TextEditor: React.FC<TextEditorProps> = ({
  className,
  error,
  disabled,
  ...rest
}) => {
  const customClassName = classNames([
    'text-editor',
    className,
    { error: !isEmpty(error), disabled },
  ]);

  return (
    <div>
      <ReactQuill
        className={customClassName}
        theme="snow"
        readOnly={disabled}
        {...rest}
      />
      {error && <Input.Error error={error} />}
    </div>
  );
};
