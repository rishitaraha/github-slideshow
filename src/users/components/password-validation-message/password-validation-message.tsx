import React, { useEffect } from 'react';

type PasswordValidationMessageProps = {
  password: string;
  setIsPasswordValidationError: (boolean) => void;
};

export const PasswordValidationMessage: React.FC<
  PasswordValidationMessageProps
> = ({ password, setIsPasswordValidationError }) => {
  // useEffect.
  useEffect(() => {
    // Ref: https://www.thepolyglotdeveloper.com/2015/05/use-regex-to-test-password-strength-in-javascript/
    const passwordValidationRegex = new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})`,
    );

    const isError = !passwordValidationRegex.test(password);
    setIsPasswordValidationError(isError);
  }, [password]);

  // Render.

  return (
    <ul className="password-validation-message-container">
      <li> Minimum 8 characters </li>
      <li> At least 1 uppercase letter </li>
      <li> At least 1 lowercase letter </li>
      <li> At least 1 number </li>
      <li> At least 1 special character </li>
    </ul>
  );
};
