import { bootstrapApplication } from '@angular/platform-browser';
import './webawesome';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
