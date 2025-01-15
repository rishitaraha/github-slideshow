import { StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastManager } from '.';

enum toastVariants {
  success = 'Success',
  error = 'Error',
  warning = 'Warning',
  info = 'Info',
}

export default {
  title: 'Atoms/Toast',
  component: ToastManager,
  argTypes: {
    variant: {
      options: Object.values(toastVariants),
      label: Object.keys(toastVariants),
      control: { type: 'select' },
    },
    content: {
      control: { type: 'text' },
    },
  },
};

type ToastStoryArgsType = {
  variant: string;
  content: string;
};

export const ToastTemplateStory: StoryObj<ToastStoryArgsType> = (args) => {
  useEffect(() => {
    switch (args.variant) {
      case 'Success': {
        toast.success(args.content);
        break;
      }
      case 'Error': {
        toast.error(args.content);
        break;
      }
      case 'Warning': {
        toast.warning(args.content);
        break;
      }
      case 'Info': {
        toast.info(args.content);
        break;
      }
    }
  }, [args.variant, args.content]);
  return <ToastManager />;
};

ToastTemplateStory.args = {
  variant: 'Success',
  content:
    'Hello World! This is a message.Hello World! This is a message.Hello World! This is a message.',
};
