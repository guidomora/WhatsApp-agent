import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReservationContextsTable20260622000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reservation_contexts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'waId',
            type: 'varchar',
          },
          {
            name: 'phone',
            type: 'varchar',
          },
          {
            name: 'reservationDate',
            type: 'varchar',
          },
          {
            name: 'reservationTime',
            type: 'varchar',
          },
          {
            name: 'reservationStartsAt',
            type: 'timestamptz',
          },
          {
            name: 'reservationEndsAt',
            type: 'timestamptz',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'quantity',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'cancelled', 'expired'],
          },
          {
            name: 'lastConversationSummary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'reservation_contexts',
      new TableIndex({
        name: 'IDX_reservation_contexts_wa_id_unique',
        columnNames: ['waId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'reservation_contexts',
      new TableIndex({
        name: 'IDX_reservation_contexts_status_ends_at',
        columnNames: ['status', 'reservationEndsAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reservation_contexts', true, true, true);
  }
}
