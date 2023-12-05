import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../common/entities/appointment.entity';
import { Between, Equal, FindOptionsWhere, Repository } from 'typeorm';
import { AvailabilityRequestDTO } from './dto/request.dto';
import { DateTime, Interval } from 'luxon';
import {
  AppointmentDTO,
  AppointmentScheduledDTO,
  AvailableAppointmentsDTO,
} from './dto/response.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  APPOINTMENT_DURATION_MINUTES,
  APPOINTMENT_LEAD_TIME_HOURS,
  UNCONFIRMED_EXPIRY_MINUTES,
} from '../common/appointment.constants';
import { Helpers } from '../common/helpers';
import { MINUTES_TO_MILLIS } from '../common/common.constants';

@Injectable()
export class AppointmentService {
  logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async getAppointmentById(appointmentId: string): Promise<AppointmentDTO> {
    const appointment = await this.repository.findOne({
      where: { appointmentId: Equal(appointmentId) },
    });

    if (!appointment) {
      Helpers.logAndThrowError(
        this.logger,
        new NotFoundException(
          `Appointment: ${appointmentId} not found, please confirm the appointmentId and try again.`,
        ),
      );
    }

    return appointment;
  }

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
    return (
      await this.repository.find({ where: whereClause, order: { time: 'ASC' } })
    ).map((appointment) => {
      return {
        appointmentId: appointment.appointmentId,
        provider: appointment.provider,
        time: appointment.time,
        available: appointment.available,
      };
    });
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
      Helpers.logAndThrowError(
        this.logger,
        new NotFoundException(
          `Appointment: ${appointmentId} not found, please confirm the appointmentId and try again.`,
        ),
      );
    }

    if (!appointment.available && appointment.client !== client) {
      Helpers.logAndThrowError(
        this.logger,
        new ConflictException(
          `Appointment: ${appointmentId} is already scheduled for another client.  Please choose a new time.`,
        ),
      );
    }

    const timeUntilAppt = Interval.fromDateTimes(
      DateTime.now().toUTC(),
      appointment.time.toUTC(),
    ).length('hours');
    if (timeUntilAppt < APPOINTMENT_LEAD_TIME_HOURS) {
      Helpers.logAndThrowError(
        this.logger,
        new BadRequestException(
          `Appointments must be made ${APPOINTMENT_LEAD_TIME_HOURS} hours in advance. Difference: ${timeUntilAppt.toFixed(
            2,
          )} Hours`,
        ),
      );
    }
    appointment.available = false;
    appointment.confirmed = false;
    appointment.client = client;
    await this.repository.save(appointment);
    this.scheduleExpiry(appointment, UNCONFIRMED_EXPIRY_MINUTES);

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
      Helpers.logAndThrowError(
        this.logger,
        new NotFoundException(
          `Appointment: ${appointmentId} not found, please confirm the appointmentId and try again.`,
        ),
      );
    }
    if (appointment.available === true) {
      Helpers.logAndThrowError(
        this.logger,
        new BadRequestException(
          `Appointment: ${appointmentId} is currently available, please schedule the appointment before attempting to confirm.`,
        ),
      );
    }
    appointment.confirmed = true;
    await this.repository.save(appointment);
    try {
      this.schedulerRegistry.deleteInterval(appointment.appointmentId);
    } catch (e) {
      if (!e.message.includes('No Interval was found')) {
        throw e;
      }
    }

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
    overwrite?: boolean,
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

    // validate enough availability for appointments
    let slot = day.plus({
      hour: body.start.hour,
      minute: body.start.minute,
    });
    if (
      slot.plus({ minutes: APPOINTMENT_DURATION_MINUTES }).toMillis() >
      end.toMillis()
    ) {
      Helpers.logAndThrowError(
        this.logger,
        new BadRequestException(
          'Provider must submit enough availability for at least one appointment.',
        ),
      );
    }

    const existingAppointments: Appointment[] = appointments.filter(
      (appointment) => appointment.provider === provider,
    );
    if (existingAppointments.length !== 0) {
      if (!overwrite) {
        Helpers.logAndThrowError(
          this.logger,
          new BadRequestException('Appointments already exists for provider'),
        );
      }
      for (const appointment of existingAppointments) {
        this.repository.delete({
          appointmentId: Equal(appointment.appointmentId),
        });
      }
    }

    //create slots every 15 minutes from start to end time
    while (
      slot.plus({ minutes: APPOINTMENT_DURATION_MINUTES }).toMillis() <=
      end.toMillis()
    ) {
      const appointment: Appointment = {
        provider,
        time: slot,
        available: true,
      };
      await this.repository.save(appointment);
      slot = slot.plus({ minutes: APPOINTMENT_DURATION_MINUTES });
    }
  }

  private scheduleExpiry(appointment: Appointment, timeout: number) {
    const callback = async () => {
      this.logger.warn(
        `Appointment ${appointment.appointmentId} unconfirmed, marking reavailable`,
      );
      appointment.client = null;
      appointment.available = true;
      await this.repository.save(appointment);
      this.schedulerRegistry.deleteInterval(appointment.appointmentId);
    };

    const interval = setInterval(callback, timeout * MINUTES_TO_MILLIS);
    this.schedulerRegistry.addInterval(appointment.appointmentId, interval);
  }
}
