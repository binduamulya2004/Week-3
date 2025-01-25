import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss'],
})
export class ResetpasswordComponent implements OnInit {
  resetForm!: FormGroup; // Define FormGroup
  userId: string | null = '';
  accessToken: string | null = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Retrieve `id` and `accessToken` from the route parameters
    this.userId = this.route.snapshot.paramMap.get('id');
    this.accessToken = this.route.snapshot.paramMap.get('accessToken');

    // Initialize the form with FormGroup, FormControl, and Validators
    this.resetForm = new FormGroup({
      passwordFields: new FormArray([
        new FormControl('', [Validators.required, Validators.minLength(6)]), // Password Field
        new FormControl('', [Validators.required, Validators.minLength(6)]), // Confirm Password Field
      ]),
    });
  }

  // Getter for FormArray
  get passwordFields(): FormArray {
    return this.resetForm.get('passwordFields') as FormArray;
  }

  resetPassword(): void {
    const password = this.passwordFields.at(0).value; // Get the password
    const confirmPassword = this.passwordFields.at(1).value; // Get the confirm password

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const url = `${environment.apiUrl}/auth/reset-password/${this.userId}/${this.accessToken}`;
    this.http.post(url, { password }).subscribe({
      next: () => {
        alert('Password reset successfully. You can now log in.');
        this.router.navigate(['/login']); // Redirect to the login page
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        alert('Failed to reset password. Please try again.');
      },
    });
  }
}
