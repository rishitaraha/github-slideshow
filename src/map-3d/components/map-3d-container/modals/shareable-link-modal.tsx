import {
  IconButton,
  IconIdentifier,
  Input,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { ShareableLinkModalProps } from './types';
import { RoutesEnum } from 'shared/routes';

export const ShareableLinkModal: React.FC<ShareableLinkModalProps> = ({
  onHide,
  show,
  isShareableLinkCopied,
  onCopyShareableLink,
  isLoadingAddWorkspace,
  slug,
}) => {
  // Constants.
  const { origin } = window.location;
  const generatedLink = `${origin}${RoutesEnum.Map3D}/${slug}`;

  // States
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  // useEffects
  useEffect(() => {
    if (slug) {
      const timer = setTimeout(() => {
        setShowCopyTooltip(true);
        setTimeout(() => setShowCopyTooltip(false), 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      backdrop="static"
      dialogClassName="shareable-link-modal map-3d-container-modal"
      restoreFocus={false}
      centered
    >
      <Modal.Header closeButton>Share Workspace</Modal.Header>
      <Modal.Body>
        <p>Aereo Cloud Workspace Link</p>
        <div className="shareable-link-container">
          <Input.Text
            value={
              isLoadingAddWorkspace ? 'Generating the Link...' : generatedLink
            }
            name="shareable-link"
            disabled
          />
          <div>
            <Tooltip
              placement={Placement.Top}
              hoverText={!isShareableLinkCopied ? 'Copy' : 'Copied'}
              className={
                isShareableLinkCopied ? `shareable-link-modal__link-copied` : ''
              }
              show={showCopyTooltip ? true : undefined}
            >
              <IconButton
                iconIdentifier={IconIdentifier.Copy}
                isLoading={isLoadingAddWorkspace}
                className="shareable-link__btn"
                onClick={() => onCopyShareableLink(generatedLink)}
              />
            </Tooltip>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
