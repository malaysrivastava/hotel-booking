import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'https://hotel-booking-kappa-three.vercel.app/api'; // Base URL for proxy

  constructor(private http: HttpClient) {}

  getData(path:string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${path}`); // Adjust endpoint as needed
  }
  postData(path:string,data:any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${path}`, data); // Adjust endpoint as needed
  }
}
