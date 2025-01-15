import { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Button } from '../../atoms';
import { Placement } from '../../enums/placement';
import { Overlay } from './overlay';
import { OverlayPopover } from './overlay-popover';

export default {
  title: 'Molecules/Overlay',
  component: Overlay,
} as Meta;

type Story = StoryObj<typeof Overlay>;

export const OverlayStory: Story = () => {
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  const target2 = useRef<HTMLButtonElement>(null);

  return (
    <div className="w-100 h-100 flex-center-rev">
      <Button ref={target} onClick={() => setShow(!show)}>
        Click me to see
      </Button>
      <Button className="mt-5" ref={target2} onClick={() => setShow2(!show2)}>
        Click me to see popover
      </Button>
      <Overlay target={target.current} show={show} placement={Placement.Right}>
        <div className="card body-txt-2 ms-3">I am an overlay</div>
      </Overlay>
      <OverlayPopover
        target={target2.current}
        show={show2}
        placement={Placement.Right}
        header="Popover Header"
        body="Popover Body"
      />
    </div>
  );
};

OverlayStory.args = {};
