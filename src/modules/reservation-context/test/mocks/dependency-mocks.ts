import { ReservationContext } from '../../entities';
import { InsertResult, Repository, UpdateResult } from 'typeorm';
import { ReservationContextRepository } from '../../domain/repository/reservation-context.repository';

export type ReservationContextRepositoryMock = jest.Mocked<
  Pick<Repository<ReservationContext>, 'findOne' | 'update' | 'upsert'>
>;

export type ReservationContextDomainRepositoryMock = jest.Mocked<
  Pick<
    ReservationContextRepository,
    'upsertActiveContext' | 'findActiveByWaId' | 'markCancelledByWaId' | 'markExpiredBefore'
  >
>;

export const createReservationContextRepositoryMock = (): ReservationContextRepositoryMock =>
  ({
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  }) as ReservationContextRepositoryMock;

export const createReservationContextDomainRepositoryMock =
  (): ReservationContextDomainRepositoryMock => ({
    upsertActiveContext: jest.fn(),
    findActiveByWaId: jest.fn(),
    markCancelledByWaId: jest.fn(),
    markExpiredBefore: jest.fn(),
  });

export const upsertResult = (): InsertResult => ({
  identifiers: [{ id: 'context-1' }],
  generatedMaps: [],
  raw: [],
});

export const updateResult = (affected: number): UpdateResult => ({
  affected,
  generatedMaps: [],
  raw: [],
});
