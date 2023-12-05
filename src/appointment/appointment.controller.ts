import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AppointmentScheduledDTO,
  AvailableAppointmentsDTO,
} from './response.dto';
import { AvailabilityRequestDTO, ScheduleAppointmentDTO } from './request.dto';
import { DateTime } from 'luxon';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Available Appointments',
  })
  @ApiResponse({
    status: 200,
    type: Array<AvailableAppointmentsDTO>,
  })
  async getAvailableAppointments(
    @Query('date') date: string,
    @Query('provider') provider: string,
  ): Promise<AvailableAppointmentsDTO[]> {
    return await this.appointmentService.getAvailableAppointments(
      date ? DateTime.fromISO(date) : undefined,
      provider ?? undefined,
    );
  }

  @Put('/:appointmentId/schedule')
  @ApiOperation({
    summary: 'Schedule Appointment to Client',
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
    summary: 'Assign Appointment to Client',
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
  @ApiResponse({
    status: 201,
  })
  async setProviderAvailability(
    @Param('provider') provider: string,
    @Body() request: AvailabilityRequestDTO,
  ): Promise<void> {
    await this.appointmentService.setProviderAvailability(provider, request);
  }
}
