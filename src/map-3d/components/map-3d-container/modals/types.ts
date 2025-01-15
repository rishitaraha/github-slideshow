import { ModalProps } from 'react-bootstrap';

export type ShareableLinkModalProps = ModalProps & {
  isShareableLinkCopied: boolean;
  onCopyShareableLink: (linkId: string) => Promise<void>;
  isLoadingAddWorkspace: boolean;
  slug: string | undefined;
};
