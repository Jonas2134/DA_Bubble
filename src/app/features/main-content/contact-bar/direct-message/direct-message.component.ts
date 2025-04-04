import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss'
})
export class DirectMessageComponent {
  showMessages = false;

  showAllMessages(){
    this.showMessages = !this.showMessages
  }
}
