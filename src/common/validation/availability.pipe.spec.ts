import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { AvailabilitySchemaValidationPipe } from './availability.pipe';
import { SchemaValidationPipe } from './schema.validation.pipe';
import { AvailabilityRequestDTO } from '../../appointment/dto/request.dto';
import { faker } from '@faker-js/faker';
import { start } from 'repl';

describe('Availability Pipe', () => {
  const metadata: ArgumentMetadata = { type: 'body' };
  const pipe = new SchemaValidationPipe(AvailabilitySchemaValidationPipe);
  let body: AvailabilityRequestDTO;

  beforeEach(() => {
    body = {
      date: faker.date.future().toISOString().split('T')[0],
      start: {
        hour: 12,
        minute: 0,
      },
      end: {
        hour: 15,
        minute: 30,
      },
    };
  });
  it('validate required fields', () => {
    expect(() => pipe.transform({}, metadata)).toThrow(
      new BadRequestException(
        '"date" is required. "start" is required. "end" is required',
      ),
    );
  });

  it('date must be in the future', () => {
    body.date = '2000-01-01';
    expect(() => pipe.transform(body, metadata)).toThrow(BadRequestException);
  });

  it('end cannot be equal to start', () => {
    body.end = body.start;
    expect(() => pipe.transform(body, metadata)).toThrow(
      new BadRequestException(
        'If start.hour and end.hour is the same, end.minute must be greater than start.minute',
      ),
    );
  });

  it('end cannot be before start', () => {
    body.end.hour = body.start.hour - 1;
    expect(() => pipe.transform(body, metadata)).toThrow(
      new BadRequestException(
        'end.hour must be greater than or equal to start.hour',
      ),
    );
  });
});
