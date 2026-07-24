import { NgIf, NgFor, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload implements OnInit {

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  response: any;
  username: string = '';
  chart: any;
  showPreview = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.username = localStorage.getItem('user') || 'User';
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  upload() {
    if (!this.selectedFile) {
      alert("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/api/upload`, formData)
      .subscribe((res: any) => {
        this.response = res;
        
        // Save to local storage
        localStorage.setItem('latestReport', JSON.stringify(res));
        let history = JSON.parse(localStorage.getItem('history') || '[]');
        history.push(res);
        localStorage.setItem('history', JSON.stringify(history));

        setTimeout(() => { this.createChart(); }, 200);
      });
  }

  createChart() {
    if (!this.response?.analysis?.parameters) return;
    const canvas = document.getElementById('healthChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const labels = this.response.analysis.parameters.map((p: any) => p.name);
    const values = this.response.analysis.parameters.map((p: any) => p.value);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Value',
          data: values,
          backgroundColor: '#4A90E2'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  downloadReport() {
  if (!this.response?.analysis) return;

  let content = "SMART HEALTH REPORT ANALYZER\n";
  content += "====================================\n\n";

  content += `Risk Level: ${this.response.analysis.riskLevel}\n`;
  content += `Health Score: ${this.response.analysis.healthScore}/100\n\n`;

  if (this.response.analysis.alerts?.length > 0) {
    content += "CRITICAL ALERTS:\n";
    this.response.analysis.alerts.forEach((a: string) => {
      content += `- ${a}\n`;
    });
    content += "\n";
  }

  content += "AI ANALYSIS:\n";
  content += this.response.analysis.aiReportSummary + "\n\n";

  content += "SYSTEM SUMMARY:\n";
  content += this.response.analysis.systemSummary + "\n\n";

  content += "PARAMETERS:\n";
  this.response.analysis.parameters.forEach((p: any) => {
    content += `${p.name}: ${p.value} ${p.unit} (${p.status})\n`;
    content += `   ${p.description}\n`;
    content += `   ${p.remark}\n\n`;
  });

  content += "DISCLAIMER:\nConsult a doctor.\n";

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'Health_Report.txt';
  a.click();
}

  getAbnormalCount(): number {
    return this.response?.analysis?.parameters?.filter((p: any) => p.status !== 'Normal').length || 0;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
}