import { Formatter, dateFormatter } from '../formatter';

describe('string formatter test', () => {
  it('should format string to title case', () => {
    // Arrange.
    const inputString = 'tHiS-is-A-STRING';

    // Act.
    const titleCaseOutput = Formatter.toTitleCase(inputString, '-');

    // Assert.
    expect(titleCaseOutput).toBe('This Is A String');
  });

  it('should format camel case string to snake case', () => {
    // Arrange.
    const inputString = 'ThisIsAStringGGG';

    // Act.
    const snakeCaseOutput = Formatter.camelCaseToSnakeCase(inputString);

    // Assert.
    expect(snakeCaseOutput).toBe('this_is_a_string_g_g_g');
  });
});

describe('date formatter test', () => {
  it('should format Date-Time object', () => {
    // Act.
    const dateInput = new Date(2022, 4, 26, 11, 5);

    // Arrange.
    const output = dateFormatter(dateInput).replace(/\u202f/g, ' ');

    // Assert.
    expect(output).toBe('26 May 2022, 11:05 am');
  });
});
