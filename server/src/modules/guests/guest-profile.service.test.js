import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindOneMock = vi.fn();
const reservationCountDocumentsMock = vi.fn();
const findProfileByUserIdMock = vi.fn();
const upsertProfileByUserIdMock = vi.fn();
const updateUserMock = vi.fn();
const createLogMock = vi.fn();

vi.mock('../reservations/reservation.model.js', () => ({
  ReservationModel: {
    countDocuments: reservationCountDocumentsMock,
  },
}));

vi.mock('../users/user.model.js', () => ({
  UserModel: {
    findOne: userFindOneMock,
  },
}));

vi.mock('../users/user.service.js', () => ({
  userService: {
    updateUser: updateUserMock,
  },
}));

vi.mock('../audit/audit.service.js', () => ({
  auditService: {
    createLog: createLogMock,
  },
}));

vi.mock('./guest-profile.repository.js', () => ({
  guestRepository: {
    findProfileByUserId: findProfileByUserIdMock,
    upsertProfileByUserId: upsertProfileByUserIdMock,
  },
}));

const makeLeanQuery = (value) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const makeProfileDoc = (value) => ({
  ...value,
  toObject: () => ({ ...value }),
});

const { guestService } = await import('./guest-profile.service.js');

describe('guestService.updateGuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards password updates to userService.updateUser', async () => {
    const existingUser = {
      _id: 'guest-1',
      role: 'guest',
      firstName: 'Old',
      lastName: 'Guest',
      fullName: 'Old Guest',
      email: 'guest@example.com',
      phone: '03001234567',
      status: 'active',
      deletedAt: null,
    };

    const updatedDbUser = {
      ...existingUser,
      firstName: 'Updated',
      fullName: 'Updated Guest',
    };

    const existingProfile = makeProfileDoc({
      userId: 'guest-1',
      nationality: 'Pakistani',
      city: 'Karachi',
    });

    const updatedProfile = makeProfileDoc({
      userId: 'guest-1',
      nationality: 'Pakistani',
      city: 'Karachi',
      notes: 'Updated note',
    });

    userFindOneMock
      .mockReturnValueOnce(makeLeanQuery(existingUser))
      .mockReturnValueOnce(makeLeanQuery(updatedDbUser));

    findProfileByUserIdMock
      .mockResolvedValueOnce(existingProfile)
      .mockResolvedValueOnce(updatedProfile);

    upsertProfileByUserIdMock.mockResolvedValue(updatedProfile);
    reservationCountDocumentsMock.mockResolvedValue(0);
    updateUserMock.mockResolvedValue({
      id: 'guest-1',
      firstName: 'Updated',
      lastName: 'Guest',
      fullName: 'Updated Guest',
      email: 'guest@example.com',
      phone: '03001234567',
      status: 'active',
      avatarUrl: null,
    });

    await guestService.updateGuest(
      'guest-1',
      {
        firstName: 'Updated',
        password: 'NewPassword123!',
        profile: {
          notes: 'Updated note',
        },
      },
      {
        actorUserId: 'admin-1',
        actorRole: 'admin',
        request: {
          ip: '127.0.0.1',
          headers: {
            'user-agent': 'vitest',
          },
        },
      },
    );

    expect(updateUserMock).toHaveBeenCalledWith(
      'guest-1',
      expect.objectContaining({
        password: 'NewPassword123!',
      }),
      expect.objectContaining({
        actorRole: 'admin',
      }),
    );
  });
});
