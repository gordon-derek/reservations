import { Logger } from '@nestjs/common';

export class Helpers {
  static logAndThrowError(logger: Logger, error: Error) {
    logger.error(error);
    throw error;
  }
}
