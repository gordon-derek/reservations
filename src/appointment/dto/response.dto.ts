import { ApiProperty } from '@nestjs/swagger';
import { DateTime } from 'luxon';

export class AppointmentDTO {
  @ApiProperty({
    description: 'A unique identifier for the appointment',
  })
  appointmentId?: string;

  @ApiProperty({
    description: 'The provider the appointment is scheduled with',
    example: 'fLastName',
  })
  provider: string;

  @ApiProperty({
    description: 'DateTime of Appointment in ISO',
    type: DateTime,
    example: '2023-12-06T05:15:00.000-08:00',
  })
  time: DateTime;

  @ApiProperty({
    description: 'Client appointment is scheduled for',
    example: 'fLastName',
  })
  client?: string;

  @ApiProperty({
    description: 'Appointment Available?',
  })
  available: boolean;

  @ApiProperty({
    description: 'whether the appointment has been confirmed',
  })
  confirmed?: boolean;
}

export class AvailableAppointmentsDTO {
  @ApiProperty({
    description: 'A unique identifier for the appointment',
  })
  appointmentId?: string;

  @ApiProperty({
    description: 'The provider the appointment is scheduled with',
    example: 'fLastName',
  })
  provider: string;

  @ApiProperty({
    description: 'DateTime of Appointment in ISO',
    type: DateTime,
    example: '2023-12-06T05:15:00.000-08:00',
  })
  time: DateTime;

  @ApiProperty({
    description: 'Appointment Available?',
  })
  available: boolean;
}

export class AppointmentScheduledDTO extends AvailableAppointmentsDTO {
  @ApiProperty({
    description: 'Client appointment is scheduled for',
    example: 'fLastName',
  })
  client: string;

  @ApiProperty({
    description: 'whether the appointment has been confirmed',
  })
  confirmed: boolean;
}
