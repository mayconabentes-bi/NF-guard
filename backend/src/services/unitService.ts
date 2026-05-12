import { unitRepository } from '../repositories/unitRepository.js';

export class UnitService {
  async getAvailableUnits(profileId: string, companyId: string, role: string) {
    // If Admin/Owner, see all units in company
    if (['ADMIN', 'OWNER'].includes(role)) {
      return await unitRepository.listByCompany(companyId);
    }
    // Otherwise, see only linked units
    return await unitRepository.listByUser(profileId);
  }

  async validateUnitAccess(profileId: string, unitId: string, role: string) {
    if (['ADMIN', 'OWNER'].includes(role)) return true;
    return await unitRepository.checkPermission(profileId, unitId);
  }
}

export const unitService = new UnitService();
