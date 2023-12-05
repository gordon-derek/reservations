import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityRequestDTO {
  @ApiProperty({
    description: 'Date we are giving availability for',
    example: 'yyyy-mm-dd',
  })
  date: string;
  @ApiProperty({
    description: 'Date time the providers availability starts',
    example: {
      hour: 15,
      minute: 15,
    },
  })
  start: { hour: number; minute: number };

  @ApiProperty({
    description: 'Date time the providers availability ends',
    example: {
      hour: 15,
      minute: 15,
    },
  })
  end: { hour: number; minute: number };
}

export class ScheduleAppointmentDTO {
  @ApiProperty({
    description: 'Client appointment is scheduled for',
    example: 'fLastName',
  })
  client: string;
}
