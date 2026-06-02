import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { InternalApiTokenGuard } from 'src/common/guards/internal-api-token.guard';
import { INTERNAL_API_TOKEN_HEADER } from 'src/constants';
import { WhatsappReservationQuotaState, WhatsappReservationQuotaSummary } from 'src/lib';
import {
  createConfigServiceMock,
  createExecutionContextMock,
} from 'src/modules/health/test/mocks/dependency-mocks';
import { GetWhatsappReservationQuotaSummaryUseCase } from '../application/get-whatsapp-reservation-quota-summary.use-case';
import { BillingUsageController } from './billing-usage.controller';

describe('BillingUsageController', () => {
  const accountId = 'account-1';
  const quotaSummary: WhatsappReservationQuotaSummary = {
    accountId,
    period: '2026-05',
    periodStart: '2026-05-01T00:00:00.000Z',
    periodEnd: '2026-06-01T00:00:00.000Z',
    plan: {
      id: 'plan-1',
      code: 'basic',
      name: 'Basic',
      monthlyWhatsappReservationLimit: 10,
    },
    used: 3,
    remaining: 7,
    overage: 0,
    state: WhatsappReservationQuotaState.AVAILABLE,
  };

  const getQuotaSummaryUseCaseMock = {
    execute: jest.fn(),
  };

  let controller: BillingUsageController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleBuilder = Test.createTestingModule({
      controllers: [BillingUsageController],
      providers: [
        {
          provide: GetWhatsappReservationQuotaSummaryUseCase,
          useValue: getQuotaSummaryUseCaseMock,
        },
      ],
    });

    moduleBuilder.overrideGuard(InternalApiTokenGuard).useValue({ canActivate: () => true });

    const moduleRef = await moduleBuilder.compile();
    controller = moduleRef.get(BillingUsageController);
  });

  it('deberia devolver el resumen de cupo para el accountId solicitado', async () => {
    getQuotaSummaryUseCaseMock.execute.mockResolvedValue(quotaSummary);

    await expect(controller.getWhatsappReservationQuota({ accountId })).resolves.toEqual(
      quotaSummary,
    );
    expect(getQuotaSummaryUseCaseMock.execute).toHaveBeenCalledWith(accountId);
  });

  it('deberia permitir estados de cupo listos para mostrar en frontend', async () => {
    const nearLimitSummary = {
      ...quotaSummary,
      remaining: 2,
      state: WhatsappReservationQuotaState.NEAR_LIMIT,
    };
    getQuotaSummaryUseCaseMock.execute.mockResolvedValue(nearLimitSummary);

    await expect(controller.getWhatsappReservationQuota({ accountId })).resolves.toMatchObject({
      state: WhatsappReservationQuotaState.NEAR_LIMIT,
      remaining: 2,
      overage: 0,
    });
  });

  it('deberia estar protegido por InternalApiTokenGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, BillingUsageController) as unknown[];

    expect(guards).toContain(InternalApiTokenGuard);
  });

  it('deberia rechazar acceso cuando falta el token interno', () => {
    const configService = createConfigServiceMock({
      INTERNAL_API_TOKEN: 'internal-secret',
    });
    const guard = new InternalApiTokenGuard(configService as unknown as ConfigService);
    const context = createExecutionContextMock({ headers: {} });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('deberia rechazar acceso cuando el token interno es invalido', () => {
    const configService = createConfigServiceMock({
      INTERNAL_API_TOKEN: 'internal-secret',
    });
    const guard = new InternalApiTokenGuard(configService as unknown as ConfigService);
    const context = createExecutionContextMock({
      headers: {
        [INTERNAL_API_TOKEN_HEADER]: 'invalid',
      },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
