import { ReservationContextStatus } from 'src/lib';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'reservation_contexts' })
@Index('IDX_reservation_contexts_status_ends_at', ['status', 'reservationEndsAt'])
export class ReservationContext {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_reservation_contexts_wa_id_unique', { unique: true })
  @Column({ type: 'varchar' })
  waId: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar' })
  reservationDate: string;

  @Column({ type: 'varchar' })
  reservationTime: string;

  @Column({ type: 'timestamptz' })
  reservationStartsAt: Date;

  @Column({ type: 'timestamptz' })
  reservationEndsAt: Date;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ReservationContextStatus,
  })
  status: ReservationContextStatus;

  @Column({ type: 'text', nullable: true })
  lastConversationSummary?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
