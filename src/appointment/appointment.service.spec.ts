import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { Appointment } from '../common/entities/appointment.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppointmentScheduledDTO } from './dto/response.dto';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let repo: Repository<Appointment>;
  let provider: string;
  let appointments: Appointment[];
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(undefined),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
        SchedulerRegistry,
      ],
    }).compile();

    provider = faker.person.firstName()[0] + faker.person.lastName();
    appointments = [
      {
        appointmentId: faker.string.uuid(),
        provider,
        time: DateTime.fromISO('2022-05-05T09:00:00.000'),
        available: true,
      },
      {
        appointmentId: faker.string.uuid(),
        provider,
        time: DateTime.fromISO('2022-05-05T09:15:00.000'),
        available: true,
      },
      {
        appointmentId: faker.string.uuid(),
        provider: faker.person.firstName()[0] + faker.person.lastName(),
        time: DateTime.fromISO('2022-05-05T09:00:00.000'),
        available: true,
      },
    ];

    service = module.get<AppointmentService>(AppointmentService);
    repo = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
  });

  describe('Get Appointments', () => {
    it('should return empty array if no appointments are available', async () => {
      await expect(service.getAvailableAppointments()).resolves.toEqual([]);
      expect(repo.find).toBeCalledTimes(1);
    });

    // this isn't really testing much, as we are returning a mocked list
    it('should allow passing in provider', async () => {
      repo.find = jest.fn().mockResolvedValue(appointments);
      await expect(
        service.getAvailableAppointments(undefined, provider),
      ).resolves.toEqual(appointments);
      expect(repo.find).toBeCalledTimes(1);
    });

    it('should allow passing in date and provider', async () => {
      repo.find = jest.fn().mockResolvedValue(appointments);
      await expect(
        service.getAvailableAppointments(
          DateTime.fromISO('2024-01-01'),
          provider,
        ),
      ).resolves.toEqual(appointments);
      expect(repo.find).toBeCalledTimes(1);
    });
  });

  describe('Assign Appointments', () => {
    it('should return a not found error if the appointment doesnt exist', async () => {
      await expect(
        service.assignAppointmentToClient('flast', faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
      expect(repo.findOne).toBeCalledTimes(1);
    });

    it('should return appointment summary on scheduled appointment', async () => {
      repo.findOne = jest.fn().mockResolvedValue(appointments[0]);
      const client = 'flast';
      const confirmation: AppointmentScheduledDTO = {
        provider: appointments[0].provider,
        time: appointments[0].time,
        client,
        confirmed: false,
        available: false,
      };
      await expect(
        service.assignAppointmentToClient(client, faker.string.uuid()),
      ).resolves.toEqual(confirmation);
      expect(repo.findOne).toBeCalledTimes(1);
      expect(repo.save).toBeCalledTimes(1);
    });
  });

  describe('Confirm Appointments', () => {
    it('appointment not found', async () => {
      await expect(
        service.confirmAppointment(faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
    });

    it('cannot confirm an available appointment', async () => {
      repo.findOne = jest.fn().mockResolvedValue(appointments[0]);
      await expect(
        service.confirmAppointment(faker.string.uuid()),
      ).rejects.toThrow(BadRequestException);
    });

    it('confirm appointment response', async () => {
      const scheduledAppt = appointments[0];
      scheduledAppt.client = 'flast';
      scheduledAppt.available = false;
      repo.findOne = jest.fn().mockResolvedValue(scheduledAppt);
      scheduledAppt.appointmentId = undefined;
      await expect(
        service.confirmAppointment(faker.string.uuid()),
      ).resolves.toEqual(scheduledAppt);
    });
  });

  describe('Provider Availability', () => {
    it('provider cannot overwrite if no flag set', async () => {
      repo.find = jest.fn().mockResolvedValue(appointments);
      await expect(
        service.setProviderAvailability(provider, {
          date: faker.date.future().toISOString(),
          start: {
            hour: 8,
            minute: 15,
          },
          end: {
            hour: 16,
            minute: 0,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('provider allowed to overwrite when flag set', async () => {
      repo.find = jest.fn().mockResolvedValue(appointments);
      await expect(
        service.setProviderAvailability(
          provider,
          {
            date: faker.date.future().toISOString(),
            start: {
              hour: 8,
              minute: 15,
            },
            end: {
              hour: 16,
              minute: 0,
            },
          },
          true,
        ),
      ).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledTimes(2);
    });

    it('provider must be able to fit in at least one appointment in availability', async () => {
      await expect(
        service.setProviderAvailability(
          provider,
          {
            date: faker.date.future().toISOString(),
            start: {
              hour: 8,
              minute: 15,
            },
            end: {
              hour: 8,
              minute: 16,
            },
          },
          true,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('properly schedules appointments for 15 minutes for duration of availability', async () => {
      await expect(
        service.setProviderAvailability(
          provider,
          {
            date: faker.date.future().toISOString(),
            start: {
              hour: 8,
              minute: 0,
            },
            end: {
              hour: 9,
              minute: 0,
            },
          },
          true,
        ),
      ).resolves.toBeUndefined();
      expect(repo.save).toBeCalledTimes(4);
    });

    it('will not schedule past end of availability', async () => {
      await expect(
        service.setProviderAvailability(
          provider,
          {
            date: faker.date.future().toISOString(),
            start: {
              hour: 8,
              minute: 0,
            },
            end: {
              hour: 8,
              minute: 59,
            },
          },
          true,
        ),
      ).resolves.toBeUndefined();
      expect(repo.save).toBeCalledTimes(3);
    });
  });
});
