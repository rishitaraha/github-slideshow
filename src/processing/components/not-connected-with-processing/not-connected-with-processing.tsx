import { Button, IconIdentifier } from '@aus-platform/design-system';
import { useContext } from 'react';
import { HeaderTitleContext } from '../../../shared/context';

export const NotConnectedWithProcessing = () => {
  // Contexts.
  const { openOrgSettingsModal } = useContext(HeaderTitleContext);

  return (
    <div className="not-connected-with-processing">
      <span className="not-connected-with-processing__img" />
      <h3 className="not-connected-with-processing__heading">
        You’re not connected to any Organisation
      </h3>
      <span className="not-connected-with-processing__text">
        Do you want to connect?
      </span>
      <Button
        rightIconIdentifier={IconIdentifier.Link}
        className="not-connected-with-processing__btn"
        onClick={openOrgSettingsModal}
      >
        Connect
      </Button>
    </div>
  );
};
