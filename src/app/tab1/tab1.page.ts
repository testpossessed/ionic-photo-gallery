import { Component, OnInit } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  constructor(private photoService: PhotoService) {}

  public async ngOnInit(): Promise<void> {
    await this.photoService.loadSaved();
  }

}
