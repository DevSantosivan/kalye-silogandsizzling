import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email = '';

  loading = false;
  emailSent = false;

  errorMessage = '';

  async sendResetLink(): Promise<void> {
    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';

      return;
    }

    this.loading = true;

    try {
      // =====================================================
      // SUPABASE PASSWORD RESET WILL GO HERE
      // =====================================================

      console.log('Sending password reset link to:', this.email);

      // Example:
      //
      // const { error } =
      //   await this.supabaseService.resetPassword(
      //     this.email
      //   );
      //
      // if (error) {
      //   throw error;
      // }

      this.emailSent = true;
    } catch (error) {
      console.error(error);

      this.errorMessage = 'Unable to send the reset link. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  resetForm(): void {
    this.email = '';
    this.emailSent = false;
    this.errorMessage = '';
  }
}
