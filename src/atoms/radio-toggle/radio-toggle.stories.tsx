import { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RadioToggle } from './radio-toggle';

export default {
  title: 'Atoms/Toggle/Radio',
  component: RadioToggle,
} as Meta;

type Story = StoryObj<typeof RadioToggle>;

export const RadioToggleStory: Story = () => {
  const [radioValue, setRadioValue] = useState('1');

  const radios = [
    { name: 'Active', value: '1' },
    { name: 'Radio', value: '2' },
    { name: 'Radio', value: '3' },
  ];

  return (
    <form>
      {radios.map((radio, index) => {
        return (
          <RadioToggle
            key={'r' + index}
            value={radio.value}
            name={radio.name}
            checked={radioValue === radio.value}
            onChange={(e) => {
              if (e.currentTarget.checked) {
                setRadioValue(e.currentTarget.value);
              }
            }}
          />
        );
      })}
    </form>
  );
};

RadioToggleStory.args = {
  checked: true,
};
