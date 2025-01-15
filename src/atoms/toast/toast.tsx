import React from 'react';
import {
  ToastContainer,
  toast as toastify,
  ToastOptions,
} from 'react-toastify';
import { Icon } from '../icon';
import { ColorClass, IconIdentifier } from '../../enums';

export const toast = {
  error: (content: React.ReactNode, options?: ToastOptions) => {
    const combinedOptions = Object.assign(
      {
        icon: () => (
          <Icon
            size={20}
            identifier={IconIdentifier.ExclamationHexagonFill}
            colorClass={ColorClass.AccentError}
          />
        ),
      },
      options,
    );
    return toastify.error(content, combinedOptions);
  },
  info: (content: React.ReactNode) =>
    toastify.info(content, {
      icon: () => (
        <Icon
          size={20}
          identifier={IconIdentifier.InfoCircleFill}
          colorClass={ColorClass.AccentPrimary}
        />
      ),
    }),
  success: (content: React.ReactNode) =>
    toastify.success(content, {
      icon: () => (
        <Icon
          size={20}
          identifier={IconIdentifier.CheckCircleFill}
          colorClass={ColorClass.AccentSuccess}
        />
      ),
    }),
  warning: (content: React.ReactNode) =>
    toastify.warning(content, {
      icon: () => (
        <Icon
          size={20}
          identifier={IconIdentifier.WarningFill}
          colorClass={ColorClass.AccentWarning}
        />
      ),
    }),
};

export const ToastManager = () => {
  const closeButton = ({ closeToast }) => {
    return (
      <Icon
        identifier={IconIdentifier.CrossSmall}
        onClick={closeToast}
        size={18}
      />
    );
  };

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      closeButton={closeButton}
    />
  );
};
