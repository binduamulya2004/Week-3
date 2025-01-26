import { Component, OnInit } from '@angular/core';
import { WebSocketService } from 'src/app/core/services/websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  userName: string = '';
  message: string = '';
  messages: { type: string; username?: string; text: string }[] = [];
  isChatStarted: boolean = false;

  constructor(private wsService: WebSocketService, private router:Router) {}

  ngOnInit(): void {
    this.wsService.messageSubject.subscribe((message) => {
      this.messages.push(message);
    });
  }

  joinChat(): void {
    if (this.userName.trim()) {
      this.isChatStarted = true;
      this.wsService.joinChat(this.userName);
    }
  }

  sendMessage(): void {
    if (this.message.trim()) {
      this.wsService.sendMessage(this.userName, this.message);
      this.message = '';
    }
  }
  redirectToInventory(){
    this.router.navigate(['/dashboard']);
  }
}
