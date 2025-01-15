import { FileExtension } from '../../enums';
import { fileValidate } from '../file-validator';
import { mockFiles } from './mock';

describe('fileValidate', () => {
  it('should return true, when file extension matches', () => {
    // Arrange.
    const csvFile = mockFiles(FileExtension.CSV);
    const mbtilesFile = mockFiles(FileExtension.MBTiles);
    const zipFile = mockFiles(FileExtension.ZIP);

    // Act.
    const validatedCsvValue = fileValidate.extension(
      csvFile,
      FileExtension.CSV,
    );
    const validatedMbtileValue = fileValidate.extension(
      mbtilesFile,
      FileExtension.MBTiles,
    );
    const validatedZipValue = fileValidate.extension(
      zipFile,
      FileExtension.ZIP,
    );

    // Assert.
    expect(validatedCsvValue).toBeTruthy();
    expect(validatedMbtileValue).toBeTruthy();
    expect(validatedZipValue).toBeTruthy();
  });

  it('should return false, when file type is not what is expected', () => {
    // Arrange.
    const csvFile = mockFiles(FileExtension.CSV);

    // Act.
    const validatedValueForMbtiles = fileValidate.extension(
      csvFile,
      FileExtension.MBTiles,
    );

    const validatedValueForZip = fileValidate.extension(
      csvFile,
      FileExtension.ZIP,
    );

    // Assert.
    expect(validatedValueForMbtiles).toBeFalsy();
    expect(validatedValueForZip).toBeFalsy();
  });
});
