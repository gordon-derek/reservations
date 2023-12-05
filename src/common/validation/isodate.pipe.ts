import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class ParseISODatePipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'query' && !value) {
      return;
    }
    const parts = value.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    const date = DateTime.fromISO(value);
    if (date.year !== year || date.month !== month || date.day !== day) {
      throw new BadRequestException(
        `Validation Error: Date: ${value} must follow ISO standard, yyyy-mm-dd`,
      );
    }
    return value;
  }
}
