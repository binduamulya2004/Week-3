import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './features/auth/components/login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { DashboardComponent } from './features/auth/components/dashboard/dashboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// import { ToastrModule } from 'ngx-toastr';
@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
     BrowserAnimationsModule, // required animations module
  //   ToastrModule.forRoot({
  //     timeOut: 5000, // duration in milliseconds
  //     positionClass: 'toast-top-center', // position of the toast
  //     preventDuplicates: true, // prevent duplicate toasts
  //     progressBar: true, // show progress bar
  //     closeButton: true, // show close button
  //     tapToDismiss: true,
  //     newestOnTop: true,
  //   }), 
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },],
  bootstrap: [AppComponent]
})
export class AppModule { }



