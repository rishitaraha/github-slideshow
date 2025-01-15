import { SelectOption } from '@aus-platform/design-system';
import { ModalProps } from 'react-bootstrap';
import { IterationListItem, SiteListItem } from 'src/shared/api';

export type CreateNewLayerInputType = {
  name: string;
  accessTags: SelectOption[] | null;
  site: SelectOption<SiteListItem> | null;
  iteration: SelectOption<IterationListItem> | null;
};

export type ChangeProjectConfirmationModalProps = ModalProps & {
  onClickSwitchProject: VoidFunction;
};

export type CreateLayerModalProps = ModalProps;

export type AddTextboxModalProps = ModalProps & {
  onAddTextBoxClick: (text: string) => void;
};
