import { ReservationContext } from '../../entities';
import { InsertResult, Repository, UpdateResult } from 'typeorm';

export type ReservationContextRepositoryMock = jest.Mocked<
  Pick<Repository<ReservationContext>, 'findOne' | 'update' | 'upsert'>
>;

export const createReservationContextRepositoryMock = (): ReservationContextRepositoryMock =>
  ({
    findOne: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  }) as ReservationContextRepositoryMock;

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
