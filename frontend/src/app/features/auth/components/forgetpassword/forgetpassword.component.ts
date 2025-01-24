import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forgetpassword',
  templateUrl: './forgetpassword.component.html',
  styleUrls: ['./forgetpassword.component.scss']
})
export class ForgetpasswordComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }
  email: string = '';

  sendResetLink(): void {
    if (this.email) {
      // Define the backend API endpoint
     

      // Make the HTTP POST request
       this.http
              .post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email } , {

              }).subscribe({
        next: (response) => {
          console.log('Reset password link sent successfully:', response);
          alert('A reset link has been sent to your email!');
        },
        error: (error) => {
          console.error('Error sending reset link:', error);
          alert('Failed to send the reset link. Please try again later.');
        }
      });
    } else {
      console.error('Email field is empty');
      alert('Please enter your email address.');
    }
  }

}
