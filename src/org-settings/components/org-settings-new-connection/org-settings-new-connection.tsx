import { Button, Input, InputGroup } from '@aus-platform/design-system';
import React, { useEffect } from 'react';
import {
  handleResponseMessage,
  useCreateProcessingOrg,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';

type OrgSettingsNewConnectionProps = {
  setIsConnectedWithProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};

const newConnectionInitialState = { orgName: '' };

export const OrgSettingsNewConnection: React.FC<
  OrgSettingsNewConnectionProps
> = ({ setIsConnectedWithProcessing }) => {
  // States.
  const {
    values,
    names,
    errors,
    onChange,
    onFocus,
    onBlur,
    inputHasError,
    inputIsDirty,
  } = useInputFields(newConnectionInitialState);

  // Apis.
  const {
    mutate: sendCreateProcessingOrgRequest,
    isSuccess: isSuccessCreateProcessingOrg,
    data: createProcessingOrgResponse,
    isError: isErrorCreateProcessingOrg,
    isPending: isLoadingCreateProcessingOrg,
    error: createProcessingOrgError,
  } = useCreateProcessingOrg();

  // useEffects.
  useEffect(() => {
    if (isSuccessCreateProcessingOrg && createProcessingOrgResponse) {
      setIsConnectedWithProcessing(true);
    }

    handleResponseMessage(
      isSuccessCreateProcessingOrg,
      isErrorCreateProcessingOrg,
      createProcessingOrgResponse,
      createProcessingOrgError,
    );
  }, [
    isSuccessCreateProcessingOrg,
    createProcessingOrgResponse,
    isErrorCreateProcessingOrg,
  ]);

  // Handlers.
  const onSubmit = (event) => {
    event.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendCreateProcessingOrgRequest(values);
    }
  };

  return (
    <div className="org-settings__new-connection">
      <InputGroup>
        <Input.Label>Organisation Name</Input.Label>
        <Input.Text
          placeholder="Enter Organisation Name"
          value={values.orgName}
          name={names.orgName}
          error={errors.orgName}
          isInvalid={!!errors.orgName}
          {...{ onChange, onFocus, onBlur }}
        ></Input.Text>
      </InputGroup>
      <Button
        isLoading={isLoadingCreateProcessingOrg}
        disabled={inputHasError()}
        onClick={onSubmit}
      >
        {isLoadingCreateProcessingOrg ? 'Connecting' : 'Create & Connect'}
      </Button>
    </div>
  );
};
