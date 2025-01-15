import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { getFileStatusText } from '../tooltip-text';

describe('tooltip text', () => {
  it('should return correct status for done or completed', () => {
    const testfileType = 'PDF';
    const completedResult = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Completed,
    );
    expect(completedResult).toBe(`${testfileType} Generated`);

    const doneResult = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Done,
    );
    expect(doneResult).toBe(`${testfileType} Generated`);
  });

  it('should return correct status for started or processing', () => {
    const testfileType = 'CSV';
    const startedResult = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Started,
    );
    expect(startedResult).toBe(`${testfileType} is Processing`);

    const processingResult = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Processing,
    );
    expect(processingResult).toBe(`${testfileType} is Processing`);
  });

  it('should return correct status for Failed', () => {
    const testfileType = 'Excel';
    const failedResult = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Failed,
    );
    expect(failedResult).toBe(`${testfileType} Failed`);
  });

  it('should return correct status for Importing', () => {
    const testfileType = 'XML';
    const expected = getFileStatusText(
      testfileType,
      StatusIndicatorLevel.Importing,
    );
    expect(expected).toBe(`Importing ${testfileType}`);
  });
});
