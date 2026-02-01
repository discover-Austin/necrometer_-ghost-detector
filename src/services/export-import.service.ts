import { Injectable, inject } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import { EnvironmentService } from './environment.service';
import { DetectedEntity } from '../types';

export interface ExportData {
  version: string;
  exportDate: string;
  detections: DetectedEntity[];
  settings?: Record<string, any>;
}

/**
 * Export and import service for backing up detection data
 */
@Injectable({
  providedIn: 'root'
})
export class ExportImportService {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);
  private env = inject(EnvironmentService);

  /**
   * Export detections to JSON
   */
  async exportToJSON(detections: DetectedEntity[], settings?: Record<string, any>): Promise<void> {
    try {
      const exportData: ExportData = {
        version: this.env.getAppVersion(),
        exportDate: new Date().toISOString(),
        detections,
        settings
      };

      const json = JSON.stringify(exportData, null, 2);
      const filename = `necrometer-backup-${Date.now()}.json`;

      if (this.env.isNative()) {
        await this.saveToFileNative(json, filename);
      } else {
        this.downloadJSON(json, filename);
      }

      this.toast.success(`Exported ${detections.length} detections`);
      this.logger.info(`Exported data to ${filename}`);
    } catch (error) {
      this.logger.error('Export failed', error);
      this.toast.error('Failed to export data');
    }
  }

  /**
   * Export detections to CSV
   */
  async exportToCSV(detections: DetectedEntity[]): Promise<void> {
    try {
      const csv = this.convertToCSV(detections);
      const filename = `necrometer-detections-${Date.now()}.csv`;

      if (this.env.isNative()) {
        await this.saveToFileNative(csv, filename);
      } else {
        this.downloadCSV(csv, filename);
      }

      this.toast.success(`Exported ${detections.length} detections to CSV`);
      this.logger.info(`Exported CSV to ${filename}`);
    } catch (error) {
      this.logger.error('CSV export failed', error);
      this.toast.error('Failed to export CSV');
    }
  }

  /**
   * Import detections from JSON
   */
  async importFromJSON(file: File): Promise<ExportData | null> {
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate data structure
      if (!data.detections || !Array.isArray(data.detections)) {
        throw new Error('Invalid backup file format');
      }

      this.toast.success(`Imported ${data.detections.length} detections`);
      this.logger.info('Import successful', data);
      return data;
    } catch (error) {
      this.logger.error('Import failed', error);
      this.toast.error('Failed to import data. Invalid file format.');
      return null;
    }
  }

  /**
   * Convert detections to CSV format
   */
  private convertToCSV(detections: DetectedEntity[]): string {
    const headers = [
      'Name',
      'Type',
      'Timestamp',
      'EMF Reading',
      'Instability',
      'Contained',
      'Backstory'
    ];

    const rows = detections.map(entity => [
      this.escapeCSV(entity.name),
      this.escapeCSV(entity.type),
      new Date(entity.timestamp).toISOString(),
      entity.emfReading.toFixed(2),
      entity.instability.toString(),
      entity.contained ? 'Yes' : 'No',
      this.escapeCSV(entity.backstory)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Escape CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Save file on native platform
   */
  private async saveToFileNative(content: string, filename: string): Promise<void> {
    const result = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    // Share the file
    await Share.share({
      title: 'Necrometer Backup',
      text: 'Export from Necrometer',
      url: result.uri,
      dialogTitle: 'Save Backup'
    });
  }

  /**
   * Download JSON file (web)
   */
  private downloadJSON(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download CSV file (web)
   */
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
