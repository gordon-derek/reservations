import { DateTime } from 'luxon';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';

export class DateTimeTransformer implements ValueTransformer {
  public from(value: string): DateTime {
    return DateTime.fromSQL(value);
  }

  public to(value: DateTime): string {
    return value.toSQL();
  }
}

@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn()
  appointmentId?: string;

  @Column({ length: 50, nullable: false })
  provider: string;

  @Column({
    type: String,
    nullable: false,
    transformer: new DateTimeTransformer(),
  })
  time: DateTime;

  @Column({
    length: 50,
    nullable: true,
  })
  client?: string;

  @Column({
    nullable: false,
  })
  available: boolean;

  @Column({
    nullable: true,
  })
  confirmed?: boolean;
}
