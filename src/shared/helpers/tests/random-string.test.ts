import { randomStringGenerator } from '../random-string-generator';

describe('randomStringGenerator', () => {
  // Arrange
  const length = 10;

  it('should generate a random string of the specified length', () => {
    // Act
    const result = randomStringGenerator(length);

    // Assert
    expect(result).toHaveLength(length);
  });

  it('should generate a string containing only the specified characters', () => {
    // Arrange
    const chars = 'ABC123';

    // Act
    const result = randomStringGenerator(length, chars);

    // Assert
    for (const char of result) {
      expect(chars).toContain(char);
    }
  });
});
