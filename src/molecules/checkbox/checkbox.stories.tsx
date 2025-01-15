import { CheckBox } from '.';

import { Meta, StoryObj } from '@storybook/react';
import { useArgs } from '@storybook/preview-api';
import { CheckboxAlignment } from '../../atoms';

const meta: Meta<typeof CheckBox> = {
  title: 'Molecules/Checkbox',
  component: CheckBox,
  argTypes: {
    alignCheckbox: {
      options: [CheckboxAlignment.Left, CheckboxAlignment.Right],
      control: { type: 'select' },
    },
  },
};

export default meta;

type InputStory = StoryObj<typeof CheckBox>;

export const CheckBoxTemplate: InputStory = (args) => {
  const [{ checked }, updateArgs] = useArgs();

  return (
    <div className="w-30">
      <CheckBox
        checked={args.checked}
        title={args.title}
        alignCheckbox={args.alignCheckbox}
        isLoading={args.isLoading}
        disabled={args.disabled}
        showCard={args.showCard}
        onClick={() => updateArgs({ checked: !checked })}
      />
    </div>
  );
};

CheckBoxTemplate.args = {
  checked: false,
  title: 'Check Box',
  alignCheckbox: CheckboxAlignment.Left,
  isLoading: true,
  disabled: false,
  showCard: false,
};
