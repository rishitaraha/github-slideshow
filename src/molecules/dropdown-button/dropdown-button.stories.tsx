import { Meta, StoryObj } from '@storybook/react';
import { DropDownButton } from '.';

export default {
  title: 'Molecules/DropDownButton',
  component: DropDownButton,
} as Meta;

type Story = StoryObj<typeof DropDownButton>;

export const DropDownButtonStory: Story = ({ ...args }) => (
  <div className="w-100 h-100 flex-center">
    <DropDownButton {...args}>
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Orthophoto (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Surface model (GeoTIFF)</DropDownButton.Item>
      <DropDownButton.Item>Project File (PSX)</DropDownButton.Item>{' '}
      <DropDownButton.Item>Point Cloud (LAZ)</DropDownButton.Item>
    </DropDownButton>
  </div>
);

DropDownButtonStory.args = {
  btnText: 'Download Output',
};
