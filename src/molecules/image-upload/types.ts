import React from 'react';
import { InputProps } from '../../atoms/input/types';
import { FeatureInfoImage } from '../../shared/components';

export type ImageUploadProps = Omit<InputProps, 'onChange'> & {
  isInvalid?: boolean;
  error?: string;
  isLoading?: boolean;
  imageSrc?: string | null;
  onClickView?: (event: React.MouseEvent) => void;
  onDelete: (featureInfoImage?: FeatureInfoImage) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
