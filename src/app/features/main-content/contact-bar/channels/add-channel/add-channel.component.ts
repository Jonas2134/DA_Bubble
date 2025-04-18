import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output, Input } from '@angular/core';
import { AddNewMembersComponent } from '../../../../general-components/add-new-members/add-new-members.component';


@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, AddNewMembersComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent{
  @Output() close = new EventEmitter<void>();
  @Input() activeUserId!: string | null;
  showAddMember: boolean = true;
  channelId: any = '';
  channelName: string = '';
  channelDescription: string = '';
  constructor( private elRef: ElementRef ) {}

  

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.elRef.nativeElement
      .querySelector('section')
      ?.contains(event.target);
    if (!clickedInside) {
      this.close.emit();
    }
  }
  
  closeWindow() {
    this.close.emit();
  }


  addNewChannel(name: string, description: string){
    if (!name || !this.activeUserId) return;

    this.channelName = name;
    this.channelDescription = description;
    this.showAddMember = false;
  }


} 
