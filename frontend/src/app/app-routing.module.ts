import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import * as path from 'path';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { DashboardComponent } from './features/auth/components/dashboard/dashboard.component';
import { ForgetpasswordComponent } from './features/auth/components/forgetpassword/forgetpassword.component';
import { ResetpasswordComponent } from './features/auth/components/resetpassword/resetpassword.component';
import { ChatComponent } from './features/auth/components/chat/chat.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/register', pathMatch: 'full' },
  {path:'forgetpassword', component:ForgetpasswordComponent},
  {path:'reset-password/:id/:accessToken', component:ResetpasswordComponent},
  {path:'chat', component:ChatComponent}

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
