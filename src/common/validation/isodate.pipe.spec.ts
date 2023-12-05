import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ParseISODatePipe } from './isodate.pipe';
import { isDataURI } from 'class-validator';

describe('ISO Date Pipe', () => {
  const paramMetadata: ArgumentMetadata = { type: 'query' };
  const isoDatePipe: ParseISODatePipe = new ParseISODatePipe();
  it('succeeds with valid isoDate', async () => {
    const date = '2001-01-04';
    expect(isoDatePipe.transform(date, paramMetadata)).toBe(date);
  });

  it('fails if date invalid format', () => {
    expect(() =>
      isoDatePipe.transform('2001/01/04', paramMetadata),
    ).toThrowError(BadRequestException);
  });

  it('fails if date has letters', () => {
    expect(() =>
      isoDatePipe.transform('1234-ab-cd', paramMetadata),
    ).toThrowError(BadRequestException);
  });

  it('fails with month higher then 12', () => {
    expect(() =>
      isoDatePipe.transform('1234-29-01', paramMetadata),
    ).toThrowError(BadRequestException);
  });
});
