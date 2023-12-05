import {
  ArgumentMetadata,
  BadRequestException,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import { ObjectSchema } from 'joi';

export class SchemaValidationPipe implements PipeTransform {
  logger = new Logger(this.constructor.name);
  constructor(private schema: ObjectSchema) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      const { error } = this.schema.validate(value, { abortEarly: false });
      if (error) {
        this.logger.error(error);
        throw new BadRequestException(error.message);
      }
    }
    return value;
  }
}
