import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SideCard,
  SideCardLocation,
  Spinner,
  SwitchCard,
  SwitchCardVariant,
} from '@aus-platform/design-system';
import React, { useContext, useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import {
  useChangePasswordRequest,
  useUpdateUserRequest,
  useUser,
} from '../../../shared/api/users';

import { handleFormInputMessage } from '../../../shared/api';
import { GlobalContext } from '../../../shared/context';
import { UserType } from '../../../shared/enums';
import { UserLocalDataManager, isOrgAdmin } from '../../../shared/helpers';
import { useInputFields } from '../../../shared/hooks';
import { userValidator } from '../../users-validator';
import { PasswordValidationMessage } from '../password-validation-message/password-validation-message';
import { ChangePasswordInput, EditUserInput, EditUserProps } from './types';

const editUserInputState: EditUserInput = {
  firstName: '',
  lastName: '',
  email: '',
  isOrgAdminUser: false,
  isDeactivateUser: false,
};

const changePasswordInputState: ChangePasswordInput = {
  password: '',
  confirmPassword: '',
};

export const EditUser: React.FC<EditUserProps> = ({
  show,
  closeEditUser,
  email,
  refetchUsers,
}) => {
  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // States.
  const [changePassword, setChangePassword] = useState(false);
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
  } = useInputFields<EditUserInput>(editUserInputState, userValidator);

  const {
    values: changePasswordInputValues,
    names: changePasswordInputNames,
    errors: changePasswordInputError,
    setValues: setChangePasswordInputValues,
    onChange: onChangePasswordInputChange,
    onBlur: onChangePasswordInputBlur,
    onFocus: onChangePasswordInputFocus,
    inputHasError: changePasswordInputHasError,
    inputIsDirty: changePasswordInputIsDirty,
  } = useInputFields<ChangePasswordInput>(changePasswordInputState);

  // Apis.
  const {
    data: userResponse,
    isSuccess: userDetailsIsSuccess,
    isLoading: userDetailsIsLoading,
    refetch,
  } = useUser(email);

  const {
    mutate: sendEditUserRequest,
    data: editUserResponse,
    isError: isErrorEditUser,
    isPending: isLoadingEditUser,
    isSuccess: isSuccessEditUser,
    error: editUserError,
  } = useUpdateUserRequest();

  const {
    mutate: sendChangePasswordRequest,
    data: changePasswordResponse,
    isError: changePasswordRequestIsError,
    isPending: changePasswordRequestIsLoading,
    isSuccess: changePasswordRequestIsSuccess,
    error: changePasswordRequestError,
  } = useChangePasswordRequest();

  // UseEffects.
  useEffect(() => {
    email && refetch();
  }, [email]);

  useEffect(() => {
    if (email && userResponse) {
      setValues({
        firstName: userResponse.data.firstName,
        lastName: userResponse.data.lastName,
        email: userResponse.data.email,
        isOrgAdminUser: isOrgAdmin(userResponse.data),
        isDeactivateUser: !userResponse.data.isActive,
      });
    }
    return () => setValues(editUserInputState);
  }, [email, userDetailsIsSuccess]);

  useEffect(() => {
    if (isSuccessEditUser && editUserResponse) {
      setValues(editUserInputState);
      refetchUsers();
      closeSideCard();
      resetAll();

      if (userResponse?.data.email === loggedUser?.email) {
        UserLocalDataManager.saveUserName(editUserResponse.data.firstName);
      }
    }

    handleFormInputMessage(
      isSuccessEditUser,
      isErrorEditUser,
      editUserResponse,
      editUserError,
      setErrors,
      setFormError,
    );
  }, [isSuccessEditUser, isErrorEditUser]);

  useEffect(() => {
    if (changePasswordRequestIsSuccess && changePasswordResponse) {
      setChangePasswordInputValues(changePasswordInputState);
      setChangePassword(false);
      closeSideCard();
    }
    handleFormInputMessage(
      changePasswordRequestIsSuccess,
      changePasswordRequestIsError,
      changePasswordResponse,
      changePasswordRequestError,
      setErrors,
      setFormError,
    );
  }, [changePasswordRequestIsSuccess, changePasswordRequestIsError]);

  // Handlers.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!inputHasError() && inputIsDirty()) {
      sendEditUserRequest({
        ...values,
        id: userResponse?.data.id,
        type: values.isOrgAdminUser ? UserType.OrgAdmin : UserType.Member,
        isActive: !values.isDeactivateUser,
      });
    } else if (!inputHasError() && !inputIsDirty() && !changePassword) {
      closeSideCard();
    }
    if (changePassword) {
      if (!changePasswordInputHasError() && changePasswordInputIsDirty()) {
        sendChangePasswordRequest({
          ...changePasswordInputValues,
          id: userResponse?.data.id,
        });
      } else {
        changePasswordInputHasError();
      }
    }
  };

  const closeSideCard = () => {
    closeEditUser();
    setChangePassword(false);
  };

  const onChangePasswordInput = (event) => {
    if (!isEmpty(formError)) {
      setFormError('');
    }
    onChangePasswordInputChange(event);
  };

  return (
    <SideCard
      showCloseButton
      title="Edit User"
      placement={SideCardLocation.End}
      onClose={closeSideCard}
      formError={formError}
      show={show}
      className="user-sidecard"
      footerClassName="justify-content-end"
      footer={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={closeSideCard}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoadingEditUser || changePasswordRequestIsLoading}
            onClick={onSubmit}
            disabled={isPasswordInvalid}
          >
            Update User Details
          </Button>
        </>
      }
    >
      {userDetailsIsLoading ? (
        <Spinner />
      ) : (
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
              disabled={true}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>

          {/* Password */}
          <div className="user-sidecard__change-password">
            <div className="user-sidecard__change-password__btn-container">
              {changePassword && (
                <Button
                  variant={ButtonVariant.Link}
                  className="user-sidecard__change-password__cancel-btn"
                  onClick={() => setChangePassword(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant={ButtonVariant.Link}
                className={`user-sidecard__change-password__btn ${
                  changePassword ? 'active' : ''
                }`}
                disabled={changePassword}
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </Button>
            </div>

            {changePassword && (
              <>
                <InputGroup>
                  <Input.Label>New Password</Input.Label>
                  <Input.Password
                    placeholder="Password"
                    value={changePasswordInputValues.password}
                    name={changePasswordInputNames.password}
                    error={changePasswordInputError.password}
                    isInvalid={!!changePasswordInputError.password}
                    autoComplete={'new-password'}
                    onChange={onChangePasswordInput}
                    onBlur={onChangePasswordInputBlur}
                    onFocus={onChangePasswordInputFocus}
                  />
                </InputGroup>
                <InputGroup>
                  <Input.Label>Confirm New Password</Input.Label>
                  <Input.Password
                    placeholder="Confirm Password"
                    value={changePasswordInputValues.confirmPassword}
                    name={changePasswordInputNames.confirmPassword}
                    error={changePasswordInputError.confirmPassword}
                    isInvalid={!!changePasswordInputError.confirmPassword}
                    onChange={onChangePasswordInputChange}
                    onBlur={onChangePasswordInputBlur}
                    onFocus={onChangePasswordInputFocus}
                  />
                </InputGroup>

                <InputGroup>
                  <PasswordValidationMessage
                    password={changePasswordInputValues.password}
                    setIsPasswordValidationError={setIsPasswordInvalid}
                  />
                </InputGroup>
              </>
            )}
          </div>
          {/* Admin Privileges */}
          <SwitchCard
            checked={values.isOrgAdminUser}
            onClick={() =>
              setValues({
                ...values,
                isOrgAdminUser: !values.isOrgAdminUser,
              })
            }
            title="Admin Privileges"
            className="user-sidecard-form__admin-privileges-switch-card"
            {...{ onFocus, onBlur, onChange }}
          />

          {/* Deactivate User */}
          <SwitchCard
            checked={values.isDeactivateUser}
            onClick={() =>
              setValues({
                ...values,
                isDeactivateUser: !values.isDeactivateUser,
              })
            }
            title="Deactivate User"
            className="user-sidecard-form__deactivate-user-switch-card"
            variant={SwitchCardVariant.Danger}
            {...{ onFocus, onBlur, onChange }}
          />
        </form>
      )}
    </SideCard>
  );
};
