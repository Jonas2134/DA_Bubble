import { Component } from '@angular/core';
import { ButtonComponent } from '../../general-components/button/button.component';
import { ComponentSwitcherService } from '../../../shared/services/component-switcher.service';
import { AuthentificationService } from '../../../shared/services/authentification.service';

@Component({
  selector: 'app-select-avatar',
  imports: [ButtonComponent],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
})
export class SelectAvatarComponent {
  avatars = [
    'avatar-1.png',
    'avatar-2.png',
    'avatar-3.png',
    'avatar-4.png',
    'avatar-5.png',
    'avatar-6.png',
  ];

  selectedAvatar: string | null = null;

  constructor(
    public componentSwitcher: ComponentSwitcherService,
    private authService: AuthentificationService
  ) {}

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
  }

  onNext(): void {
    if (!this.selectedAvatar) {
      console.error('No avatar selected!');
      return;
    }
    this.authService
      .updateProfilePicture(this.selectedAvatar)
      .then(() => {
        console.log('Profile picture successfully added!');
        this.changeComponent('login');
      })
      .catch((error) => {
        console.error('Error when adding the profile picture: ', error);
      }
    );
  }

  changeComponent(componentName: string) {
    this.componentSwitcher.setComponent(componentName);
  }
}
