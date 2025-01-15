import { useState } from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { SliderComponent } from './slider';

export default {
  title: 'Atoms/Slider',
  component: SliderComponent,
} as Meta;

type Story = StoryObj<typeof SliderComponent>;

export const SliderStory: Story = () => {
  const [sliderValue, setSliderValue] = useState(0);

  const onChangeSlider = (value) => {
    setSliderValue(value);
  };
  return (
    <div className="story">
      <SliderComponent value={sliderValue} onChange={onChangeSlider} />
    </div>
  );
};

SliderStory.args = {};
