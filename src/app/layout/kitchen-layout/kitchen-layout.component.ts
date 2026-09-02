import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-kitchen-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './kitchen-layout.component.html',
  styleUrl: './kitchen-layout.component.scss',
})
export class KitchenLayoutComponent {
  isFullscreen = false;

  async toggleFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        this.isFullscreen = true;
      } else {
        await document.exitFullscreen();
        this.isFullscreen = false;
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement;
  }
}
