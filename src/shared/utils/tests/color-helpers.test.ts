import { hexToRGB } from '../color-helpers';

describe('color helper test', () => {
  it('should return rgb string when given hex string', () => {
    // Arrange.
    const hexString = '#00ff00';

    // Act.
    const rgbString = hexToRGB(hexString);

    // Assert.
    expect(rgbString).toBe('rgb(0,255,0)');
  });

  it('should return rgba string when given hex string and alpha value', () => {
    // Arrange.
    const hexString = '#00ffff';

    // Act.
    const rgbaString = hexToRGB(hexString, 0.4);

    // Assert.
    expect(rgbaString).toBe('rgba(0,255,255,0.4)');
  });
});
