import { ButtonProps } from 'react-bootstrap';
import { Modify } from '../../shared/type-utils';
import { IconIdentifier } from '../../enums';
import { FabOrientation } from './enums';

export type FabProps = Modify<
  ButtonProps,
  {
    leftIconIdentifier?: IconIdentifier;
    rightIconIdentifier?: IconIdentifier;
    active?: boolean;
    size?: number;
    isLoading?: boolean;
    dataTestId?: string;
  }
>;

export type FabStackProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: FabOrientation;
};
