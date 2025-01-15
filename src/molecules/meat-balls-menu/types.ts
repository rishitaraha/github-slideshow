import { DropdownProps as BootstrapDropdownProps } from 'react-bootstrap';
import { DropdownItemProps as BootstrapDropdownItemProps } from 'react-bootstrap/esm/DropdownItem';
import { ForwardRef, Modify } from '../../shared/type-utils';
import { MeatBallsMenuDirection, MeatBallsSize } from './enums';

export type MeatBallsMenuItemProps = BootstrapDropdownItemProps & {
  isLoading?: boolean;
};

export type MeatBallsMenuComponents = {
  Item: ForwardRef<HTMLElement, MeatBallsMenuItemProps>;
};

export type MeatBallsMenuProps = Modify<
  BootstrapDropdownProps,
  {
    drop: MeatBallsMenuDirection;
    showMenu?: boolean;
    size?: MeatBallsSize;
  }
>;
