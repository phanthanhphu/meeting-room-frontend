import { generateRandomPassword, isValidPassword, PASSWORD_POLICY } from '../../utils/passwordPolicy';
import { ROLE_OPTIONS } from '../../auth/roles';

export const USER_ROLES = ROLE_OPTIONS.map((item) => item.value);
export { ROLE_OPTIONS };
export const USER_STATUS = ['ACTIVE', 'DISABLED'];
export const EMPTY_USER_FORM = { username: '', name: '', email: '', department: '', role: 'USER', active: true, password: '' };
export { generateRandomPassword, isValidPassword, PASSWORD_POLICY };
