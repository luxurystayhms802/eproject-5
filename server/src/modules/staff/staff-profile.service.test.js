import { beforeEach, describe, expect, it, vi } from 'vitest';

const userFindOneMock = vi.fn();
const findProfileByUserIdMock = vi.fn();
const upsertProfileByUserIdMock = vi.fn();
const updateUserMock = vi.fn();
const createLogMock = vi.fn();

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

vi.mock('./staff-profile.repository.js', () => ({
  staffRepository: {
    findProfileByUserId: findProfileByUserIdMock,
    upsertProfileByUserId: upsertProfileByUserIdMock,
    findProfileByEmployeeCode: vi.fn(),
  },
}));

const makeLeanQuery = (value) => ({
  lean: vi.fn().mockResolvedValue(value),
});

const makeProfileDoc = (value) => ({
  ...value,
  toObject: () => ({ ...value }),
});

const { staffService } = await import('./staff-profile.service.js');

describe('staffService.updateStaff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards password updates to userService.updateUser', async () => {
    const existingUser = {
      _id: 'staff-1',
      role: 'receptionist',
      firstName: 'Desk',
      lastName: 'Agent',
      fullName: 'Desk Agent',
      email: 'reception@example.com',
      phone: '03001234567',
      status: 'active',
      deletedAt: null,
    };

    const updatedDbUser = {
      ...existingUser,
      firstName: 'Front',
      fullName: 'Front Agent',
    };

    const existingProfile = makeProfileDoc({
      userId: 'staff-1',
      employeeCode: 'EMP-REC-101',
      department: 'reception',
      designation: 'Receptionist',
      shift: 'morning',
    });

    const updatedProfile = makeProfileDoc({
      ...existingProfile.toObject(),
      designation: 'Senior Receptionist',
    });

    userFindOneMock
      .mockReturnValueOnce(makeLeanQuery(existingUser))
      .mockReturnValueOnce(makeLeanQuery(updatedDbUser));

    findProfileByUserIdMock
      .mockResolvedValueOnce(existingProfile)
      .mockResolvedValueOnce(updatedProfile);

    upsertProfileByUserIdMock.mockResolvedValue(updatedProfile);
    updateUserMock.mockResolvedValue({
      id: 'staff-1',
      firstName: 'Front',
      lastName: 'Agent',
      fullName: 'Front Agent',
      email: 'reception@example.com',
      phone: '03001234567',
      role: 'receptionist',
      status: 'active',
      avatarUrl: null,
    });

    await staffService.updateStaff(
      'staff-1',
      {
        firstName: 'Front',
        password: 'DeskPass123!',
        profile: {
          designation: 'Senior Receptionist',
        },
      },
      {
        actorUserId: 'admin-1',
        request: {
          ip: '127.0.0.1',
          headers: {
            'user-agent': 'vitest',
          },
        },
      },
    );

    expect(updateUserMock).toHaveBeenCalledWith(
      'staff-1',
      expect.objectContaining({
        password: 'DeskPass123!',
      }),
      expect.objectContaining({
        allowRoleChange: true,
      }),
    );
  });
});
