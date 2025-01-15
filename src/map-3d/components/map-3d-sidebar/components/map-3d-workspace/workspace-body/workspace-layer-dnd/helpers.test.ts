import { reorderList } from './helpers';

describe('DnD Helpers Tests', () => {
  describe('list reordering test', () => {
    test('it should move item to a new index, adjusting array accordingly', () => {
      // Arrange.
      const arr = [10, 20, 30, 40, 50, 60, 70];

      // Act.
      const reorderedList = reorderList(arr, 2, 5);
      const expectedOutput = [10, 20, 40, 50, 60, 30, 70];

      // Assert.
      expect(reorderedList).toStrictEqual(expectedOutput);
    });

    test('it should not do anything if the index does not exist in array', () => {
      // Arrange.
      const arr = [10, 20, 30, 40, 50, 60, 70];

      // Act.
      const reorderedList = reorderList(arr, 5, 9);

      // Assert.
      expect(reorderedList).toStrictEqual(arr);
    });
  });
});
