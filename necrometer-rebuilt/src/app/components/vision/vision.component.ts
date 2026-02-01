
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vision.component.html',
  styleUrls: ['./vision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisionComponent {}
