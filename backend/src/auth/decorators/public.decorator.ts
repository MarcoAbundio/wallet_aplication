import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as accessible without a valid access token.
 * Use sparingly - only for login, refresh and health checks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
