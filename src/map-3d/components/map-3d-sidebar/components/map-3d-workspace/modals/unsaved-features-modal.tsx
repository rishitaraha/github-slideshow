import {
  Button,
  ButtonVariant,
  FormMessage,
  FormMessageVariant,
} from '@aus-platform/design-system';
import { isFunction } from 'lodash';
import { Modal } from 'react-bootstrap';
import { setShowUnsavedFeaturesModal } from 'map-3d/shared/map-3d-slices';
import { useAppDispatch } from 'src/app/hooks';

export const UnsavedFeaturesModal: React.FC<{
  show: boolean;
  onExit?: () => void;
  onSaveAndExit?: () => void;
}> = ({ show, onExit, onSaveAndExit }) => {
  const dispatch = useAppDispatch();

  return (
    <Modal
      show={show}
      onHide={() => {
        dispatch(setShowUnsavedFeaturesModal(false));
      }}
      size="sm"
      backdrop="static"
      className="workspace-unsaved-features-modal workspace-modal"
      contentClassName="w-40"
      centered
    >
      <Modal.Header closeButton> Unsaved Changes </Modal.Header>
      <Modal.Body>
        <div className="workspace-unsaved-features-modal__content">
          Are you sure you want to leave this page?
        </div>
        <FormMessage
          variant={FormMessageVariant.Warning}
          message="There is unsaved data that will be lost if you proceed."
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onExit}
          disabled={!isFunction(onExit)}
        >
          Exit without Saving
        </Button>
        <Button onClick={onSaveAndExit} disabled={!isFunction(onSaveAndExit)}>
          Save & Exit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
