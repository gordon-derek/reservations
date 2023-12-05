import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from '../common/entities/appointment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment]), ScheduleModule.forRoot()],
  providers: [AppointmentService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
