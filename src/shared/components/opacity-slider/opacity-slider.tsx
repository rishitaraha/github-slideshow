import { Input, SliderComponent } from '@aus-platform/design-system';
import { isArray } from 'lodash';
import { preventNonNumber } from 'shared/helpers';

type OpacitySliderProps = {
  opacity: number;
  onChangeOpacity: (opacity: number) => void;
};

export const OpacitySlider: React.FC<OpacitySliderProps> = ({
  opacity = 100,
  onChangeOpacity,
}) => {
  // Handlers.
  const onChangeSlider = (value: number[] | number) => {
    if (isArray(value)) {
      onChangeOpacity(value[0]);
    } else {
      onChangeOpacity(value);
    }
  };

  const onChangeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const opacityValue = Number(event.currentTarget.value);

    if (isNaN(opacityValue)) {
      onChangeOpacity(0);
    } else {
      onChangeOpacity(Math.max(0, Math.min(100, opacityValue)));
    }
  };

  return (
    <div className="opacity-slider">
      <SliderComponent
        value={opacity}
        onChange={onChangeSlider}
        tipProps={{ visible: false }}
      />
      <div className="opacity-slider__input-container">
        <Input.Number
          value={opacity}
          min={0}
          max={100}
          onKeyDown={preventNonNumber}
          onChange={onChangeInput}
        />
      </div>
    </div>
  );
};
