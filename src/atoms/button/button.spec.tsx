import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Button, ButtonProps } from './button';

const renderButton = ({ disabled }: ButtonProps) => {
  render(<Button disabled={disabled} />);
};

describe('Testing enabled and disabled state of the button.', () => {
  test('Enabled state', async () => {
    renderButton({ disabled: false });
    expect(screen.getByRole('button')).toBeEnabled();
  });

  test('Disabled state', async () => {
    renderButton({ disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
