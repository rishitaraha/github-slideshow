import { binarySearchNearestValue, fillArray } from '../helpers';

describe('fillArray', () => {
  it('should fill an array with object', () => {
    //Arrange.
    const length = 5;
    const arrayElement = { key: 'value' };

    //Act.
    const result = fillArray(length, arrayElement);

    //Assert.
    expect(result).toHaveLength(length);
    expect(result.every((item) => item === arrayElement)).toBe(false);
  });

  it('should throw an error for invalid arrayElement', () => {
    // Arrange.
    const length = 5;
    const invalidElement = null;

    // Act.
    const result = fillArray(length, invalidElement);

    //Assert.
    expect(result).toHaveLength(length);
    expect(result.every((item) => item === invalidElement)).toBe(false);
  });
});

describe('binarySearchNearestValue', () => {
  it('should return the index of the exact value when present in the array', () => {
    // Arrange.
    const array = [10, 20, 30, 40, 50];
    const value = 30;

    // Act.
    const index = binarySearchNearestValue(array, value);

    // Assert.
    expect(index).toBe(2);
  });

  it('should return the index of the nearest value when the exact value is not in the array', () => {
    // Arrange.
    const array = [10, 20, 30, 40, 50];
    const value = 25;

    // Act.
    const index = binarySearchNearestValue(array, value);

    // Assert.
    expect(index).toBe(1);
  });

  it('should handle cases where the value is less than all elements in the array', () => {
    // Arrange.
    const array = [10, 20, 30, 40, 50];
    const value = 5;

    // Act.
    const index = binarySearchNearestValue(array, value);

    // Assert.
    expect(index).toBe(0);
  });

  it('should handle cases where the value is greater than all elements in the array', () => {
    // Arrange.
    const array = [10, 20, 30, 40, 50];
    const value = 55;

    // Act.
    const index = binarySearchNearestValue(array, value);

    // Assert.
    expect(index).toBe(4);
  });

  it('should handle an array with a single element', () => {
    // Arrange.
    const array = [25];
    const value = 10;

    // Act.
    const index = binarySearchNearestValue(array, value);

    // Assert.
    expect(index).toBe(0);
  });
});
