import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss'],
})
export class ResetpasswordComponent implements OnInit {
  resetForm!: FormGroup;
  userId: string | null = '';
  accessToken: string | null = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.accessToken = this.route.snapshot.paramMap.get('accessToken');

    this.resetForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });
  }

  resetPassword(): void {
    console.log("resett password");
    const password = this.resetForm.get('password')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;

    console.log(password);
    console.log(confirmPassword);

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const url = `${environment.apiUrl}/auth/reset-password/${this.userId}/${this.accessToken}`;
    this.http.post(url, { password }).subscribe({
      next: () => {
        alert('Password reset successfully. You can now log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        alert('Failed to reset password. Please try again.');
      },
    });
  }
}
