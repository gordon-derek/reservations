import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Between, Equal, FindOptionsWhere, Repository } from 'typeorm';
import { AvailabilityRequestDTO } from './request.dto';
import { DateTime, Interval } from 'luxon';
import {
  AppointmentScheduledDTO,
  AvailableAppointmentsDTO,
} from './response.dto';

@Injectable()
export class AppointmentService {
  logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
  ) {}

  async getAvailableAppointments(
    date?: DateTime,
    provider?: string,
  ): Promise<AvailableAppointmentsDTO[]> {
    this.logger.log('getAvailableAppointments');
    const whereClause: FindOptionsWhere<Appointment> = { available: true };
    if (date) {
      //add dates whereClause
      whereClause.time = Between(date.startOf('day'), date.endOf('day'));
    }
    if (provider) {
      //get available appointments for a provider
      whereClause.provider = Equal(provider);
    }
    //get all appointments
    return (await this.repository.find({ where: whereClause })).map(
      (appointment) => {
        return {
          appointmentId: appointment.appointmentId,
          provider: appointment.provider,
          time: appointment.time,
          available: appointment.available,
        };
      },
    );
  }

  async assignAppointmentToClient(
    client: string,
    appointmentId: string,
  ): Promise<AppointmentScheduledDTO> {
    this.logger.log('assignAppointmentToClient');
    const appointment = await this.repository.findOne({
      where: { appointmentId: Equal(appointmentId) },
    });

    if (!appointment) {
      const error = new NotFoundException(
        `Appointment: ${appointmentId} not found, please confirm the appointmentId and try again.`,
      );
      this.logger.error(error);
      throw error;
    }

    if (!appointment.available && appointment.client !== client) {
      const error = new ConflictException(
        `Appointment: ${appointmentId} is already scheduled for another client.  Please choose a new time.`,
      );
      this.logger.error(error);
      throw error;
    }

    const timeUntilAppt = Interval.fromDateTimes(
      DateTime.now(),
      appointment.time,
    ).length('hours');
    if (timeUntilAppt < 24) {
      const error = new BadRequestException(
        `Appointments must be made 24 hours in advance. Difference: ${timeUntilAppt.toFixed(
          2,
        )} Hours`,
      );
      this.logger.error(error);
      throw error;
    }
    appointment.available = false;
    appointment.confirmed = false;
    appointment.client = client;
    await this.repository.save(appointment);

    return {
      provider: appointment.provider,
      available: appointment.available,
      client: appointment.client,
      time: appointment.time,
      confirmed: appointment.confirmed,
    };
  }

  async confirmAppointment(
    appointmentId: string,
  ): Promise<AppointmentScheduledDTO> {
    const appointment = await this.repository.findOne({
      where: { appointmentId: Equal(appointmentId) },
    });

    if (!appointment) {
      const error = new NotFoundException(
        `Appointment: ${appointmentId} not found, please confirm the appointmentId and try again.`,
      );
      this.logger.error(error);
      throw error;
    }

    appointment.confirmed = true;
    await this.repository.save(appointment);

    return {
      provider: appointment.provider,
      available: appointment.available,
      client: appointment.client,
      time: appointment.time,
      confirmed: appointment.confirmed,
    };
  }

  async setProviderAvailability(
    provider: string,
    body: AvailabilityRequestDTO,
  ): Promise<void> {
    this.logger.log('setProviderAvailability');
    const day = DateTime.fromISO(body.date);
    const end = day.plus({
      hour: body.end.hour,
      minute: body.end.minute,
    });
    //validate provider doesn't already have scheduled availability for that time of day already
    const appointments: Appointment[] = await this.repository.find({
      where: [
        {
          time: Between(day.startOf('day'), day.endOf('day')),
        },
      ],
    });

    if (
      appointments.filter((appointment) => appointment.provider === provider)
        .length !== 0
    ) {
      const error = new BadRequestException(
        'Appointments already exists for provider',
      );
      this.logger.error(error);
      throw error;
    }
    //create slots every 15 minutes from start to end time
    let slot = day.plus({ hour: body.start.hour, minute: body.start.minute });
    while (slot.plus(15).toMillis() <= end.toMillis()) {
      const appointment: Appointment = {
        provider,
        time: slot,
        available: true,
      };
      await this.repository.save(appointment);
      slot = slot.plus({ minutes: 15 });
    }
  }
}
