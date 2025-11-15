import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClass">
      @switch (type) {
        @case ('text') {
          <div class="skeleton-base h-4 w-full rounded"></div>
        }
        @case ('heading') {
          <div class="skeleton-base h-8 w-3/4 rounded"></div>
        }
        @case ('avatar') {
          <div class="skeleton-base h-12 w-12 rounded-full"></div>
        }
        @case ('card') {
          <div class="skeleton-base h-32 w-full rounded-lg"></div>
        }
        @case ('button') {
          <div class="skeleton-base h-10 w-24 rounded"></div>
        }
        @case ('custom') {
          <div class="skeleton-base rounded" [style.height.px]="height" [style.width.px]="width"></div>
        }
        @default {
          <div class="skeleton-base h-4 w-full rounded"></div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-base {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 25%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'heading' | 'avatar' | 'card' | 'button' | 'custom' = 'text';
  @Input() height?: number;
  @Input() width?: number;
  @Input() containerClass: string = '';
}
