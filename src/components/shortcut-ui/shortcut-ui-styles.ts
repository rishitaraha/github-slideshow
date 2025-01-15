import styled from 'styled-components';

export const ShortcutUIContainer = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  height: 172px;
  width: 400px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const ShortcutTypeContainer = styled.div`
  width: 100%;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ShortcutName = styled.div`
  width: 140px;
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
  text-align: left;
`;

export const ShortcutSlider = styled.div`
  width: 160px;
`;

export const ShortcutTime = styled.div`
  width: 60px;
  height: 34px;
  font-size: 12px;
  font-weight: 500;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
`;
