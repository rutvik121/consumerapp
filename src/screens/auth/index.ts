/**
 * AUTHENTICATION SCREENS
 *
 *   Splash → Welcome → Login  → Verify ─┐
 *                    → Register → Verify ┴→ Authenticated Experience
 *
 * One OTP screen serves both intents, because verifying a number is the same
 * step either way. Registration is where the user type is established, and the
 * user type determines everything after it.
 */
export { SplashScreen } from './SplashScreen';
export { WelcomeScreen } from './WelcomeScreen';
export { LoginScreen } from './LoginScreen';
export { OtpScreen } from './OtpScreen';
export { RegisterScreen } from './RegisterScreen';
