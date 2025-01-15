import classNames from 'classnames';
import { isArray } from 'lodash';
import React, { ReactNode } from 'react';
import { Icon, Input } from '../../atoms';
import { IconIdentifier } from '../../enums';

export enum FormMessageVariant {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Success = 'success',
  Default = 'default',
}

const defaultIconsForVariants = {
  [FormMessageVariant.Info]: IconIdentifier.InfoCircle,
  [FormMessageVariant.Warning]: IconIdentifier.Warning,
  [FormMessageVariant.Error]: IconIdentifier.InfoCircle,
  [FormMessageVariant.Success]: IconIdentifier.CheckCircle,
};

type FormMessageProps = {
  message: string | ReactNode;
  variant?: FormMessageVariant;
  className?: string;
  showIcon?: boolean;
  iconIdentifier?: IconIdentifier;
};
export const FormMessage: React.FC<FormMessageProps> = ({
  message,
  variant = FormMessageVariant.Error,
  className,
  showIcon,
  iconIdentifier,
}) => {
  const customClassName = classNames(['form-message', className], {
    [variant]: !!variant,
  });

  const renderFormError = (): string | React.ReactNode => {
    if (isArray(message)) {
      return <Input.Error error={message} />;
    }

    return message;
  };

  return (
    <div className={customClassName}>
      {showIcon && (
        <Icon
          identifier={iconIdentifier ?? defaultIconsForVariants[variant]}
          size={15}
          className="form-message__icon"
        />
      )}
      {renderFormError()}
    </div>
  );
};
