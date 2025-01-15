import { Meta, StoryObj } from '@storybook/react';
import { CheckboxAlignment, Input, InputGroup } from '.';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  argTypes: {
    alignCheckbox: {
      options: [CheckboxAlignment.Left, CheckboxAlignment.Right],
      control: { type: 'select' },
    },
  },
};

export default meta;

type InputStory = StoryObj<typeof Input>;

const selectOptions = [
  { value: 'Chocolate', label: 'Chocolate' },
  { value: 'Banana', label: 'Banana' },
  { value: 'Strawberry', label: 'Strawberry' },
  { value: 'Orange', label: 'Orange' },
];

export const InputTemplate: InputStory = {
  render: () => (
    <div className="w-30">
      <InputGroup>
        <Input.Label>Text</Input.Label>
        <Input.Text />
      </InputGroup>
      <InputGroup>
        <Input.Label>Password</Input.Label>
        <Input.Password />
      </InputGroup>
      <InputGroup>
        <Input.Label>File</Input.Label>
        <Input.File />
      </InputGroup>
      <InputGroup>
        <Input.Label>Select</Input.Label>
        <Input.Select options={selectOptions} />
      </InputGroup>
      <InputGroup>
        <Input.Label>SearchBar</Input.Label>
        <Input.Search />
      </InputGroup>
      <InputGroup>
        <Input.Label>Date</Input.Label>
        <Input.Date />
      </InputGroup>
      <InputGroup>
        <Input.Label>Color</Input.Label>
        <Input.Color />
      </InputGroup>
    </div>
  ),
};
