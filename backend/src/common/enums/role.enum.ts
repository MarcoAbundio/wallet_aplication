// Unifica el rol con el enum generado por Prisma para evitar errores TS2322
// (UserRole de Prisma es union de strings, incompatible con un `enum` local
// aunque tengan los mismos valores). Re-exportarlo mantiene `Role.ADMIN`,
// `Role[]`, `@IsEnum(Role)` y `@ApiProperty({ enum: Role })` funcionando.
export { UserRole as Role } from '@prisma/client';
