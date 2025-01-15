import { StoryObj, Meta } from '@storybook/react';
import { Pill, PillVariant } from './pill';
import { PillsContainer } from './pills-container';
import { IconIdentifier } from '../../enums';

export default {
  title: 'Atoms/Pill',
  component: Pill,
  argTypes: {
    variant: {
      options: Object.values(PillVariant),
      label: Object.keys(PillVariant),
      control: { type: 'select' },
    },
    leftIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select', default: 'none' },
    },
    rightIconIdentifier: {
      options: Object.values(IconIdentifier),
      control: { type: 'select' },
    },
  },
} as Meta;

type Story = StoryObj<typeof Pill>;

export const PillStory: Story = () => {
  const pillStrings = Array.from(
    Array(20),
    () => 'Site ' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  );
  return (
    <PillsContainer>
      {pillStrings.map((s, i) => (
        <Pill key={'demoPill' + i}>{s}</Pill>
      ))}
    </PillsContainer>
  );
};

PillStory.args = {};
