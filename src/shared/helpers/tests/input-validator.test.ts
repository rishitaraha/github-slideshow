import { validate } from '../input-validator';

describe('input validator test', () => {
  const validInput = {
    email: 'atuac@wojoz.vu',
    password: 'hellowworld',
    confirmPassword: 'hellowworld',
    newPassword: 'hello',
    confirmNewPassword: 'hello',
  };

  const invalidInput = {
    email: 'aaaa@',
    password: 'hwllo',
    confirmPassword: 'hello',
    newPassword: 'hwllo1',
    confirmNewPassword: 'hello1',
  };

  const emptyInput = {
    email: '',
    confirmPassword: '',
    confirmNewPassword: '',
  };

  it('should check if an email is valid', () => {
    const validEmailOuput = validate('email', validInput);
    expect(validEmailOuput).toBe('');
  });

  it('should check if email is invalid', () => {
    const invalidEmailOutput = validate('email', invalidInput);
    expect(invalidEmailOutput).toBe('Please enter a valid email');
  });

  it('should check if an email is empty', () => {
    const emptyEmailOutput = validate('email', emptyInput);
    expect(emptyEmailOutput).toBe('Email is required');
  });

  it('should check if confirm password is not equal to the password', () => {
    const mismatchedPasswordOutput = validate('confirmPassword', invalidInput);
    expect(mismatchedPasswordOutput).toBe('Passwords do not match');
  });

  it('should check if confirm password is empty', () => {
    const emptyConfirmPasswordOutput = validate('confirmPassword', emptyInput);
    expect(emptyConfirmPasswordOutput).toBe('Please confirm the password');
  });

  it('should check if confirm password is equal to the password', () => {
    const validConfirmPasswordOutput = validate('confirmPassword', validInput);
    expect(validConfirmPasswordOutput).toBe('');
  });

  it('should check if confirm new password is not equal to new password field', () => {
    const invalidConfirmNewPasswordOutput = validate(
      'confirmNewPassword',
      invalidInput,
    );

    expect(invalidConfirmNewPasswordOutput).toBe('Passwords do not match');
  });

  it('should check if confirm new password is empty', () => {
    const emptyConfirmNewPasswordOutput = validate(
      'confirmNewPassword',
      emptyInput,
    );
    expect(emptyConfirmNewPasswordOutput).toBe(
      'Please confirm the new password',
    );
  });

  it('should check if confirm new password is equal to new password field.', () => {
    const validConfirmNewPasswordOutput = validate(
      'confirmNewPassword',
      validInput,
    );

    expect(validConfirmNewPasswordOutput).toBe('');
  });
});
