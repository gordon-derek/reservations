import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AppointmentDTO,
  AppointmentScheduledDTO,
  AvailableAppointmentsDTO,
} from './dto/response.dto';
import {
  AvailabilityRequestDTO,
  ScheduleAppointmentDTO,
} from './dto/request.dto';
import { DateTime } from 'luxon';
import { ParseISODatePipe } from '../common/validation/isodate.pipe';
import { SchemaValidationPipe } from '../common/validation/schema.validation.pipe';
import { AvailabilitySchemaValidationPipe } from '../common/validation/availability.pipe';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Available Appointments',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'the date you are looking for available appointments on',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'the provider you are looking for appointments with',
    example: 'fLastName',
  })
  @ApiResponse({
    status: 200,
    type: Array<AvailableAppointmentsDTO>,
  })
  async getAvailableAppointments(
    @Query('date', ParseISODatePipe) date: string,
    @Query('provider') provider: string,
  ): Promise<AvailableAppointmentsDTO[]> {
    return await this.appointmentService.getAvailableAppointments(
      date ? DateTime.fromISO(date) : undefined,
      provider ?? undefined,
    );
  }

  @Get('/:appointmentId')
  @ApiOperation({
    summary: 'Get appointment by ID',
  })
  @ApiResponse({
    status: 200,
    type: AppointmentDTO,
  })
  async getAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ) {
    return await this.appointmentService.getAppointmentById(appointmentId);
  }

  @Put('/:appointmentId/reserve')
  @ApiOperation({
    summary: 'Reserve Appointment to Client',
  })
  @ApiResponse({
    status: 200,
    type: AppointmentScheduledDTO,
  })
  async assignAvailableAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() request: ScheduleAppointmentDTO,
  ) {
    return await this.appointmentService.assignAppointmentToClient(
      request.client,
      appointmentId,
    );
  }

  @Put('/:appointmentId/confirm')
  @ApiOperation({
    summary: 'Confirm Appointment for Client',
  })
  @ApiResponse({
    status: 200,
    type: AppointmentScheduledDTO,
  })
  async confirmAppointment(@Param('appointmentId') appointmentId: string) {
    return await this.appointmentService.confirmAppointment(appointmentId);
  }

  @Post('/:provider/availability')
  @ApiOperation({
    summary: 'Add Availability for a provider',
  })
  @ApiQuery({
    name: 'overwrite',
    required: false,
    description: 'flag if provider wants to overwrite their availability',
    example: '2024-01-01',
  })
  @ApiResponse({
    status: 201,
  })
  @UsePipes(new SchemaValidationPipe(AvailabilitySchemaValidationPipe))
  async setProviderAvailability(
    @Param('provider') provider: string,
    @Body() request: AvailabilityRequestDTO,
    @Query('overwrite') overwrite?: boolean,
  ): Promise<void> {
    await this.appointmentService.setProviderAvailability(
      provider,
      request,
      overwrite ?? false,
    );
  }
}
