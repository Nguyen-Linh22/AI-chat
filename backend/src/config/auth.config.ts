import type { SignOptions } from 'jsonwebtoken'

const parsedRounds = Number(process.env.BCRYPT_SALT_ROUNDS)

/**
 * Bcrypt cost factor (salt rounds).
 * Giá trị hợp lệ theo chuẩn Bcrypt là từ 4 đến 31.
 * Mặc định là 10 nếu không được cấu hình hoặc cấu hình không hợp lệ.
 */
export const BCRYPT_SALT_ROUNDS: number =
  Number.isInteger(parsedRounds) && parsedRounds >= 4 && parsedRounds <= 31
    ? parsedRounds
    : 10

/**
 * Thời hạn sống của JWT Access Token (VD: '7d', '1h', '15m').
 * Mặc định là '7d' nếu không được cấu hình trong biến môi trường JWT_EXPIRES_IN.
 */
export const JWT_EXPIRES_IN: NonNullable<SignOptions['expiresIn']> =
  (process.env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>) || '7d'
