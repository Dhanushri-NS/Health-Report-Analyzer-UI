import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {  Upload } from './upload/upload';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ HttpClientModule, Upload],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('health-analyzer-ui');
}
