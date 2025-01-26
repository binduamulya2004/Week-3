import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: WebSocket;
  public messageSubject = new Subject<{ type: string; username?: string; text: string }>();

  constructor() {
    this.socket = new WebSocket('ws://localhost:3000'); // Update with your WebSocket server URL

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageSubject.next(message);
    };
  }

  joinChat(username: string): void {
    this.socket.send(JSON.stringify({ type: 'join', username }));
  }

  sendMessage(username: string, text: string): void {
    this.socket.send(JSON.stringify({ type: 'message', username, text }));
  }
}
