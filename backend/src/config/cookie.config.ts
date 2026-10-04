import { CookieOptions } from 'express'

export const isProduction = (): boolean => process.env.NODE_ENV === 'production'

/**
 * Returns cookie options for setting the authentication JWT token.
 * 
 * Production (cross-site frontend -> backend):
 * - sameSite: 'none'
 * - secure: true
 * - httpOnly: true
 * - path: '/'
 * - maxAge: 7 days (604800000 ms)
 * - domain: undefined (Host-only cookie)
 * 
 * Development / Test:
 * - sameSite: 'lax'
 * - secure: false
 * - httpOnly: true
 * - path: '/'
 * - maxAge: 7 days (604800000 ms)
 * - domain: undefined (Host-only cookie)
 */
export const getAuthCookieOptions = (): CookieOptions => {
  const prod = isProduction()
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}

/**
 * Returns cookie options for clearing the authentication JWT token.
 * Must match the attributes (Path, SameSite, Secure, HttpOnly) used when
 * the cookie was set, so modern browsers successfully delete it.
 */
export const getAuthClearCookieOptions = (): CookieOptions => {
  const prod = isProduction()
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    path: '/'
  }
}
