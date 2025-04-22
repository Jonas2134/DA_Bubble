import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HeaderBarComponent } from './header-bar/header-bar.component';
import { DirectMessageComponent } from './direct-message/direct-message.component';
import { ChannelsComponent } from './channels/channels.component';

@Component({
  selector: 'app-contact-bar',
  standalone: true,
  imports: [CommonModule, HeaderBarComponent, DirectMessageComponent, ChannelsComponent],
  templateUrl: './contact-bar.component.html',
  styleUrl: './contact-bar.component.scss'
})

export class ContactBarComponent {
  @Input() sectionVisible?: boolean = true;
  @Input() activeUserId!: string | null;
  @Output() toggle = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{ chatType: 'private' | 'channel'; chatId: string }>();
  @Output() messageInToggle = new EventEmitter<boolean>();


  toggleMessageIn() {
    this.messageInToggle.emit(true);
  }
  

  toggleSection() {
    this.toggle.emit();
  }


  onChatOpen(eventData: { chatType: 'private' | 'channel'; chatId: string }): void {
    this.openChat.emit(eventData);
  }
}
