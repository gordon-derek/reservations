import * as Joi from 'joi';

export const AvailabilitySchemaValidationPipe = Joi.object({
  date: Joi.date().min(new Date().setUTCHours(0, 0, 0, 0)).required(),
  start: Joi.object({
    hour: Joi.number().min(0).max(23).required(),
    minute: Joi.number().min(0).max(59).required(),
  }).required(),
  end: Joi.object({
    hour: Joi.number()
      .min(Joi.ref('...start.hour'))
      .max(23)
      .required()
      .messages({
        'number.min': 'end.hour must be greater than or equal to start.hour',
      }),
    minute: Joi.alternatives().conditional('...start.hour', {
      is: Joi.ref('hour'),
      then: Joi.number()
        .greater(Joi.ref('...start.minute'))
        .max(59)
        .required()
        .messages({
          'number.greater':
            'If start.hour and end.hour is the same, end.minute must be greater than start.minute',
        }),
      otherwise: Joi.number().min(0).max(59).required(),
    }),
  }).required(),
});
