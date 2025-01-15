import React, { useEffect, useState } from 'react';

import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SideCard,
  SideCardLocation,
  SwitchCard,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import { useAddUserRequest } from '../../../shared/api/users';
import { handleFormInputMessage } from '../../../shared/api';
import { UserType } from '../../../shared/enums';
import { useInputFields } from '../../../shared/hooks';
import { PasswordValidationMessage } from '../password-validation-message';
import { AddUserInput, AddUserProps } from './types';
import { userValidator } from 'src/users/users-validator';

const addUserInputState: AddUserInput = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  isOrgAdminUser: false,
};

export const AddUser: React.FC<AddUserProps> = ({
  show,
  closeAddUser,
  refetchUsers,
}) => {
  // States.
  const [formError, setFormError] = useState<string | string[]>('');
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    setErrors,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
  } = useInputFields<AddUserInput>(addUserInputState, userValidator);

  // Apis.
  const {
    mutate: sendAddUserRequest,
    data: addUserResponse,
    isError: isErrorAddUser,
    isPending: isLoadingAddUser,
    isSuccess: isSuccessAddUser,
    error: addUserError,
  } = useAddUserRequest();

  // UseEffects.
  useEffect(() => {
    if (isSuccessAddUser && addUserResponse) {
      onCloseAddUser();
      setValues(addUserInputState);
      refetchUsers();
      resetAll();
    }
    handleFormInputMessage(
      isSuccessAddUser,
      isErrorAddUser,
      addUserResponse,
      addUserError,
      setErrors,
      setFormError,
    );
  }, [isSuccessAddUser, isErrorAddUser]);

  // Handlers.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendAddUserRequest({
        ...values,
        type: values.isOrgAdminUser ? UserType.OrgAdmin : UserType.Member,
      });
    }
  };

  const onCloseAddUser = () => {
    closeAddUser();
    setFormError('');
    resetAll();
  };

  const onChangePasswordInput = (event) => {
    if (!isEmpty(formError)) {
      setFormError('');
    }
    onChange(event);
  };

  return (
    <SideCard
      showCloseButton
      title="Add User"
      placement={SideCardLocation.End}
      onClose={onCloseAddUser}
      formError={formError}
      show={show}
      className="user-sidecard"
      footerClassName="justify-content-end"
      footer={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onCloseAddUser}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoadingAddUser}
            disabled={inputHasError() || isPasswordInvalid}
            onClick={onSubmit}
          >
            Add User
          </Button>
        </>
      }
    >
      <form
        className="user-sidecard-form"
        onSubmit={onSubmit}
        autoComplete={'new-password'}
      >
        <div className="user-sidecard-form__name-container">
          {/* First Name */}
          <InputGroup>
            <Input.Label>First Name</Input.Label>
            <Input.Text
              placeholder="First Name"
              value={values.firstName}
              name={names.firstName}
              error={errors.firstName}
              isInvalid={!!errors.firstName}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>

          {/* Last Name */}
          <InputGroup>
            <Input.Label>Last Name</Input.Label>
            <Input.Text
              placeholder="Last Name"
              value={values.lastName}
              name={names.lastName}
              error={errors.lastName}
              isInvalid={!!errors.lastName}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </div>

        {/* Email */}
        <InputGroup>
          <Input.Label>Email</Input.Label>
          <Input.Text
            placeholder="Email"
            value={values.email}
            name={names.email}
            error={errors.email}
            isInvalid={!!errors.email}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>

        {/* Password */}
        <InputGroup>
          <Input.Label>Password</Input.Label>
          <Input.Password
            placeholder="Password"
            value={values.password}
            name={names.password}
            error={errors.password}
            isInvalid={!!errors.password}
            autoComplete={'new-password'}
            onChange={onChangePasswordInput}
            {...{ onBlur, onFocus }}
          />
        </InputGroup>

        {/* Confirm Password */}
        <InputGroup>
          <Input.Label>Confirm Password</Input.Label>
          <Input.Password
            placeholder="Confirm Password"
            value={values.confirmPassword}
            name={names.confirmPassword}
            error={errors.confirmPassword}
            isInvalid={!!errors.confirmPassword}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>

        <InputGroup>
          <PasswordValidationMessage
            password={values.password}
            setIsPasswordValidationError={setIsPasswordInvalid}
          />
        </InputGroup>

        {/* Admin Privileges */}
        <SwitchCard
          checked={values.isOrgAdminUser}
          onClick={() =>
            setValues({ ...values, isOrgAdminUser: !values.isOrgAdminUser })
          }
          title="Admin Privileges"
          className="user-sidecard-form__admin-privileges-switch-card"
          onBlur={onBlur}
        />
      </form>
    </SideCard>
  );
};
