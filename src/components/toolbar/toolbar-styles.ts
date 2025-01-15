import styled from 'styled-components';
import { ToolbarContainerProps } from './types';

export const ToolbarContainer = styled.div<ToolbarContainerProps>`
  display: ${(props: ToolbarContainerProps) => (props.disp ? 'block' : 'none')};
  width: 300px;
  height: 170px;
  padding: 10px 20px;
  box-sizing: border-box;
  position: absolute;
  top: 60px;
  left: 120px;
  z-index: 100;
  background-color: #707070aa;
  border-radius: 5px;
`;
