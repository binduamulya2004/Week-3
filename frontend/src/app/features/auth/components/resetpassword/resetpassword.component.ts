import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss']
})
export class ResetpasswordComponent implements OnInit {
  password: string = '';
  confirmPassword: string = '';
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
  }

  resetPassword(): void {
    if (!this.password || !this.confirmPassword) {
      alert('Both password fields are required.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    console.log('****',this.password);
    

    const url = `${environment.apiUrl}/auth/reset-password/${this.userId}/${this.accessToken}`;
    this.http
      .post(url, { password: this.password })
      .subscribe({
        next: () => {
          alert('Password reset successfully. You can now log in.');
          this.router.navigate(['/login']); // Redirect to the login page
        },
        error: (err) => {
          console.error('Error resetting password:', err);
          alert('Failed to reset password. Please try again.');
        }
      });
  }
}
