import { Injectable, signal } from '@angular/core';
import { CameraPreview } from '@capacitor-community/camera-preview';

@Injectable({
  providedIn: 'root',
})
export class CameraAnalysisService {
  visualNoiseScore = signal<number>(0);
  
  private analysisInterval: any = null;
  private previousBrightness: number | null = null;
  private previousEdgeDensity: number | null = null;
  private frameCount = 0;

  startAnalysis() {
    if (this.analysisInterval) return;
    
    // Analyze frames every 500ms
    this.analysisInterval = setInterval(() => {
      this.analyzeFrame();
    }, 500);
  }

  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  private async analyzeFrame() {
    try {
      // Capture a frame from the camera
      const result = await CameraPreview.captureSample({
        quality: 50 // Lower quality for faster analysis
      });
      
      if (!result.value) return;
      
      // Convert base64 to image for analysis
      const img = new Image();
      img.onload = () => {
        this.processImage(img);
      };
      img.src = 'data:image/jpeg;base64,' + result.value;
      
    } catch (err) {
      // Camera not available or error - set neutral score
      this.visualNoiseScore.set(0.25);
    }
  }

  private processImage(img: HTMLImageElement) {
    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use smaller resolution for faster processing
    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate brightness
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    
    // Calculate edge density using simple edge detection
    let edgeCount = 0;
    const threshold = 30;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = (y * canvas.width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        const right = ((data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3);
        const bottom = ((data[idx + canvas.width * 4] + data[idx + canvas.width * 4 + 1] + data[idx + canvas.width * 4 + 2]) / 3);
        
        if (Math.abs(current - right) > threshold || Math.abs(current - bottom) > threshold) {
          edgeCount++;
        }
      }
    }
    const edgeDensity = edgeCount / ((canvas.width - 2) * (canvas.height - 2));
    
    // Calculate instability metrics
    let brightnessChange = 0;
    let edgeFluctuation = 0;
    
    if (this.previousBrightness !== null) {
      brightnessChange = Math.abs(avgBrightness - this.previousBrightness) / 255;
    }
    
    if (this.previousEdgeDensity !== null) {
      edgeFluctuation = Math.abs(edgeDensity - this.previousEdgeDensity);
    }
    
    this.previousBrightness = avgBrightness;
    this.previousEdgeDensity = edgeDensity;
    
    // Combine metrics into visualNoiseScore (0-1)
    // Higher score = more chaos/movement
    const noiseScore = Math.min(1, (brightnessChange * 2 + edgeFluctuation * 3) / 2);
    
    // Smooth the score over frames
    this.visualNoiseScore.update(current => {
      return current * 0.7 + noiseScore * 0.3;
    });
    
    this.frameCount++;
  }
}
