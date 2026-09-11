import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  loading = false;

  errorMessage = '';
  successMessage = '';

  // =====================================================
  // PASSWORD REQUIREMENTS
  // =====================================================

  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasNumber(): boolean {
    return /\d/.test(this.password);
  }

  get passwordsMatch(): boolean {
    return (
      this.password.length > 0 &&
      this.confirmPassword.length > 0 &&
      this.password === this.confirmPassword
    );
  }

  // =====================================================
  // PASSWORD VALID
  // =====================================================

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasNumber && this.passwordsMatch;
  }

  // =====================================================
  // PASSWORD TOGGLES
  // =====================================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  async resetPassword(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!this.password || !this.confirmPassword) {
      this.errorMessage = 'Please enter and confirm your new password.';

      return;
    }

    if (!this.hasMinLength) {
      this.errorMessage = 'Password must be at least 8 characters long.';

      return;
    }

    if (!this.hasNumber) {
      this.errorMessage = 'Password must contain at least one number.';

      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage = 'Passwords do not match.';

      return;
    }

    // ===================================================
    // LOADING
    // ===================================================

    this.loading = true;

    try {
      /*
       * ACTUAL SUPABASE UPDATE WILL BE HERE
       *
       * Example:
       *
       * const { error } =
       *   await this.supabaseService.client.auth.updateUser({
       *     password: this.password
       *   });
       *
       * if (error) {
       *   throw error;
       * }
       */

      console.log('Password passed validation.');

      this.successMessage = 'Your password has been updated successfully.';

      this.password = '';
      this.confirmPassword = '';
    } catch (error) {
      console.error('Reset password error:', error);

      this.errorMessage = 'Unable to update your password. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
