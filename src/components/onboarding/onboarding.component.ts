import { Component, ChangeDetectionStrategy, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Define the structure for each onboarding slide
type OnboardingSlide = {
  title: string;
  text: string;
  icon: string; // Using icon names (e.g., from an icon font or SVG set)
};

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  @Output() completed = new EventEmitter<void>();

  // The content for the onboarding slides
  slides: OnboardingSlide[] = [
    {
      title: 'Welcome, Field Agent',
      text: 'You have been issued a Necrometer, a device capable of detecting and analyzing paranormal entities.',
      icon: 'radar',
    },
    {
      title: 'Detect & Analyze',
      text: 'Use the scanner to detect spectral energy. Higher EMF readings indicate a stronger presence. Once detected, the entity will be logged for analysis.',
      icon: 'ghost',
    },
    {
      title: 'Safety Protocols',
      text: 'This is not a toy. Always exercise caution. The entities you encounter are unpredictable. Do not taunt the spirits.',
      icon: 'shield-alert',
    },
  ];

  // The index of the currently visible slide
  currentSlide = signal(0);

  // Navigate to the next slide
  next() {
    if (this.currentSlide() < this.slides.length - 1) {
      this.currentSlide.update(i => i + 1);
    }
  }

  // Complete the onboarding process
  finish() {
    this.completed.emit();
  }
}
