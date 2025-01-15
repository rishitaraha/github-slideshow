import React, { useEffect, useState } from 'react';

import {
  Button,
  ButtonVariant,
  FormMessage,
  Input,
  InputGroup,
  Spinner,
} from '@aus-platform/design-system';
import { isEmpty } from 'lodash';
import { Modal } from 'react-bootstrap';
import { handleFormInputMessage } from '../shared/api';
import {
  useChangeLoggedUserPasswordRequest,
  useLoggedUser,
  useUpdateUserRequest,
} from '../shared/api/users';
import { UserLocalDataManager } from '../shared/helpers/local-storage-managers';
import { useInputFields } from '../shared/hooks';
import { PasswordValidationMessage } from '../users/components';
import { ChangePasswordInput, ProfileProps, UpdateUserInput } from './types';

const updateUserInputState: UpdateUserInput = {
  firstName: '',
  lastName: '',
  email: '',
};

const changePasswordInputState: ChangePasswordInput = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

export const Profile: React.FC<ProfileProps> = ({ show, closeProfile }) => {
  // States.
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [formError, setFormError] = useState<string>('');
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
  } = useInputFields<UpdateUserInput>(updateUserInputState);

  const {
    values: changePasswordInputValues,
    names: changePasswordInputNames,
    errors: changePasswordInputError,
    setValues: setChangePasswordInputValues,
    setErrors: setChangePasswordInputErrors,
    onChange: onChangePasswordInputChange,
    onBlur: onChangePasswordInputBlur,
    onFocus: onChangePasswordInputFocus,
    inputHasError: changePasswordInputFieldsHasError,
    inputIsDirty: changePasswordInputIsDirty,
  } = useInputFields<ChangePasswordInput>(changePasswordInputState);

  // Apis.
  const {
    data: user,
    refetch: refetchUserDetails,
    isSuccess: userDetailsIsSuccess,
    isLoading: userDetailsIsLoading,
  } = useLoggedUser();

  const {
    mutate: sendUpdateUserRequest,
    data: updateUserResponse,
    isError: isErrorUpdateUser,
    isPending: isLoadingUpdateUser,
    isSuccess: isSuccessUpdateUser,
    error: updateUserError,
  } = useUpdateUserRequest();

  const {
    mutate: sendChangePasswordRequest,
    data: changePasswordResponse,
    isError: changePasswordRequestIsError,
    isPending: changePasswordRequestIsLoading,
    isSuccess: changePasswordRequestIsSuccess,
    error: changePasswordRequestError,
  } = useChangeLoggedUserPasswordRequest();

  // UseEffects.
  useEffect(() => {
    if (show) {
      refetchUserDetails();
    }
  }, [show]);

  useEffect(() => {
    if (userDetailsIsSuccess && user) {
      setValues({
        firstName: user.data.firstName,
        lastName: user.data.lastName,
        email: user.data.email,
      });
    }
  }, [userDetailsIsSuccess, user]);

  useEffect(() => {
    if (isSuccessUpdateUser && updateUserResponse) {
      UserLocalDataManager.saveUserName(updateUserResponse.data.firstName);
      onCloseProfile();
    }
    handleFormInputMessage(
      isSuccessUpdateUser,
      isErrorUpdateUser,
      updateUserResponse,
      updateUserError,
      setErrors,
      setFormError,
    );
  }, [isSuccessUpdateUser, isErrorUpdateUser]);

  useEffect(() => {
    if (changePasswordRequestIsSuccess && changePasswordResponse) {
      setChangePasswordInputValues(changePasswordInputState);
      setIsPasswordChanged(false);
      onCloseProfile();
    } else {
      handleFormInputMessage(
        changePasswordRequestIsSuccess,
        changePasswordRequestIsError,
        changePasswordResponse,
        changePasswordRequestError,
        setChangePasswordInputErrors,
        setFormError,
      );
    }
  }, [changePasswordRequestIsSuccess, changePasswordRequestIsError]);

  // Handlers.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendUpdateUserRequest({
        ...values,
        id: user?.data.id,
      });
    }

    if (isPasswordChanged) {
      if (
        !changePasswordInputFieldsHasError() &&
        changePasswordInputIsDirty()
      ) {
        sendChangePasswordRequest({
          ...changePasswordInputValues,
        });
      }
    }
  };

  const onCloseProfile = () => {
    resetAll();
    closeProfile();
    setFormError('');
  };

  const onChangePasswordInput = (event) => {
    if (!isEmpty(formError)) {
      setFormError('');
    }
    onChangePasswordInputChange(event);
  };

  return (
    <Modal
      show={show}
      onHide={onCloseProfile}
      size="sm"
      backdrop="static"
      dialogClassName="profile__modal"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <h2 className="profile__title">Update User Details</h2>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {userDetailsIsLoading ? (
          <Spinner />
        ) : (
          <form
            className="profile-form"
            onSubmit={onSubmit}
            autoComplete={'new-password'}
          >
            <div className="profile-form__name-container">
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
                disabled={true}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>

            {/* Password */}
            <div className="profile__change-password">
              <Button
                variant={ButtonVariant.Link}
                className={
                  isPasswordChanged
                    ? 'profile__change-password__btn active'
                    : 'profile__change-password__btn'
                }
                disabled={isPasswordChanged}
                onClick={() => setIsPasswordChanged(true)}
              >
                Change Password
              </Button>
              {isPasswordChanged && (
                <Button
                  className="profile__change-password__cancel-btn"
                  onClick={() => setIsPasswordChanged(false)}
                  variant={ButtonVariant.Link}
                >
                  Cancel
                </Button>
              )}
              {isPasswordChanged && (
                <div className="profile__change-password__form">
                  <InputGroup>
                    <Input.Label>Current Password</Input.Label>
                    <Input.Password
                      placeholder="Current Password"
                      value={changePasswordInputValues.currentPassword}
                      name={changePasswordInputNames.currentPassword}
                      error={changePasswordInputError.currentPassword}
                      isInvalid={!!changePasswordInputError.currentPassword}
                      autoComplete={'new-password'}
                      onChange={onChangePasswordInputChange}
                      onBlur={onChangePasswordInputBlur}
                      onFocus={onChangePasswordInputFocus}
                    />
                  </InputGroup>
                  <InputGroup>
                    <Input.Label>New Password</Input.Label>
                    <Input.Password
                      placeholder="New Password"
                      value={changePasswordInputValues.newPassword}
                      name={changePasswordInputNames.newPassword}
                      error={changePasswordInputError.newPassword}
                      isInvalid={!!changePasswordInputError.newPassword}
                      autoComplete={'new-password'}
                      onChange={onChangePasswordInput}
                      onBlur={onChangePasswordInputBlur}
                      onFocus={onChangePasswordInputFocus}
                    />
                  </InputGroup>
                  <InputGroup>
                    <Input.Label>Confirm New Password</Input.Label>
                    <Input.Password
                      placeholder="Confirm New Password"
                      value={changePasswordInputValues.confirmNewPassword}
                      name={changePasswordInputNames.confirmNewPassword}
                      error={changePasswordInputError.confirmNewPassword}
                      isInvalid={!!changePasswordInputError.confirmNewPassword}
                      onChange={onChangePasswordInputChange}
                      onBlur={onChangePasswordInputBlur}
                      onFocus={onChangePasswordInputFocus}
                    />
                  </InputGroup>
                  <InputGroup>
                    <PasswordValidationMessage
                      password={changePasswordInputValues.newPassword}
                      setIsPasswordValidationError={setIsPasswordInvalid}
                    />
                  </InputGroup>
                </div>
              )}
            </div>
            <InputGroup>
              {!isEmpty(formError) && <FormMessage message={formError} />}
            </InputGroup>
            <div>
              <Button
                type="submit"
                isLoading={
                  isLoadingUpdateUser || changePasswordRequestIsLoading
                }
                className="profile__btn"
                disabled={isPasswordInvalid}
              >
                Update Details
              </Button>
            </div>
          </form>
        )}
      </Modal.Body>
    </Modal>
  );
};
