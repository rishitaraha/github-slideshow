import { msToTimeString, createdAtFormatter } from '../time'; // Replace with the actual path to your utility file

describe('Utility Functions', () => {
  describe('mStoTimeString', () => {
    it('should format milliseconds to a time string', () => {
      // Arrange
      const milliseconds = 3600000;

      // Act
      const result = msToTimeString(milliseconds);

      // Assert
      expect(result).toBe('01:00:00');
    });
  });

  describe('createdAtFormatter', () => {
    it('should format a valid date', () => {
      // Arrange
      const validDate = new Date('2023-09-20T12:30:00');

      // Act
      const result = createdAtFormatter(validDate);

      // Assert
      expect(result).toBe('20 Sep 2023, 12:30 PM');
    });

    it('should handle invalid dates', () => {
      // Arrange
      const invalidDate = new Date('invalid-date-string');

      // Act
      const result = createdAtFormatter(invalidDate);

      // Assert
      expect(result).toBe('');
    });
  });
});
