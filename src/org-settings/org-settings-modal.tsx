import { RadioToggle } from '@aus-platform/design-system';
import React, { useContext, useEffect, useState } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { GlobalContext } from '../shared/context';
import {
  OrgSettingsExistingConnection,
  OrgSettingsNewConnection,
} from './components';

type OrgSettingsModalProps = ModalProps & { onClose: () => void };

enum ConnectionType {
  Existing = 'existing',
  New = 'new',
}

export const OrgSettingsModal: React.FC<OrgSettingsModalProps> = ({
  onClose,
  show,
  ...rest
}) => {
  // Contexts.
  const { loggedUser, setLoggedUser } = useContext(GlobalContext);

  // States
  const [selectedConnectionType, setSelectedConnectionType] =
    useState<ConnectionType>();
  const [connectedWithProcessing, setConnectedWithProcessing] = useState(false);

  // useEffects.
  useEffect(() => {
    if (show && loggedUser) {
      setConnectedWithProcessing(loggedUser.isConnectedWithProcessing);
    }
  }, [show]);

  useEffect(() => {
    if (connectedWithProcessing) {
      setSelectedConnectionType(ConnectionType.Existing);
    }
    if (loggedUser) {
      setLoggedUser({
        ...loggedUser,
        isConnectedWithProcessing: connectedWithProcessing,
      });
    }
  }, [connectedWithProcessing]);

  // Handlers.
  const onRadioToggleClick = (event) => {
    if (event.currentTarget.checked) {
      setSelectedConnectionType(event.currentTarget.value);
    }
  };

  // Renders.
  const orgSettingsFormRender = () => {
    if (selectedConnectionType === ConnectionType.Existing) {
      return (
        <OrgSettingsExistingConnection
          isConnectedWithProcessing={connectedWithProcessing}
          setIsConnectedWithProcessing={setConnectedWithProcessing}
        />
      );
    } else if (selectedConnectionType === ConnectionType.New) {
      return (
        <OrgSettingsNewConnection
          setIsConnectedWithProcessing={setConnectedWithProcessing}
        />
      );
    }
  };

  return (
    <Modal
      {...rest}
      show={show}
      onHide={onClose}
      size="sm"
      backdrop="static"
      dialogClassName="org-settings"
      centered
    >
      <Modal.Header closeButton>Organisation Settings</Modal.Header>
      <Modal.Body>
        {!connectedWithProcessing && (
          <>
            <div className="org-settings__radio-toggle-group__label">
              Connection Type
            </div>
            <div className="org-settings__radio-toggle-group">
              <RadioToggle
                value={ConnectionType.Existing}
                name={ConnectionType.Existing}
                label="Existing Processing Org"
                checked={selectedConnectionType === ConnectionType.Existing}
                onChange={onRadioToggleClick}
                className={connectedWithProcessing ? 'no-toggle' : ''}
              />

              <RadioToggle
                value={ConnectionType.New}
                name={ConnectionType.New}
                label="New Processing Org"
                checked={selectedConnectionType === ConnectionType.New}
                onChange={onRadioToggleClick}
              />
            </div>
          </>
        )}
        {orgSettingsFormRender()}
      </Modal.Body>
    </Modal>
  );
};
