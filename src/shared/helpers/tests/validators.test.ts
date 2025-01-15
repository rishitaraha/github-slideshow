import { isJsonString, isMultiple } from '../validators';

describe('test for string validator', () => {
  it('should return true when given a valid JSON string', () => {
    const jsonInput = '{"result":true, "count":42}';
    const output = isJsonString(jsonInput);
    expect(output).toBeTruthy();
  });

  it('should return false when given an invalid JSON string', () => {
    const jsonInput = '{"result":true, "count":42@@@';
    const output = isJsonString(jsonInput);
    expect(output).not.toBeTruthy();
  });
});

describe('test for checking multiple of number', () => {
  it('should return true if x is a multiple of y', () => {
    const output = isMultiple(100, 10);
    expect(output).toBeTruthy();
  });

  it('should return false if x is not a multiple of y', () => {
    const output = isMultiple(10, 100);
    expect(output).not.toBeTruthy();
  });
});
