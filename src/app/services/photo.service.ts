import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { Plugins, CameraResultType, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@capacitor/core';

import { Photo } from '../models/photo';
import { fileURLToPath } from 'url';

const { Camera, FileSystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE = 'photos';

  constructor(private platform: Platform) {}

  public async addNewToGallery() {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift({ filePath: 'soon...', webViewPath: capturedPhoto.webPath });
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  public async loadSaved() {
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    if (!this.platform.is('hybrid')) {
      for (const photo of this.photos) {
        const readFile = await FileSystem.readFile({
          path: photo.filePath,
          directory: FilesystemDirectory.Data,
        });

        photo.webViewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  private async savePicture(cameraPhoto: CameraPhoto): Promise<Photo> {
    const base64Data = await this.readAsBase64(cameraPhoto);

    const fileName = new Date().getTime() + '.jpg';
    const savedFile = await FileSystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        filePath: savedFile.uri,
        webViewPath: Capacitor.convertFileSrc(savedFile.uri)
      };
    } else {
      return {
        filePath: fileName,
        webViewPath: cameraPhoto.webPath,
      };
    }
  }

  private async readAsBase64(cameraPhoto: CameraPhoto): Promise<string> {
    if (this.platform.is('hybrid')) {
      const file = await FileSystem.readFile({
        path: cameraPhoto.path,
      });
      return file;
    } else {
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      return (await this.convertBlobToBase64(blob)) as string;
    }
  }

  private convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    })
}
