import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  floors: any[] = []; // Array to store floors and rooms
  numberOfRooms: any = null; // For input field binding
  isBooking: boolean = false; // To track booking state
  responseMessage: string = ''; // To display the response message

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.fetchRooms();
  }

    // Fetch room data from API
    fetchRooms() {
      this.dataService.getData('room/fetchRoom').subscribe(
        (response: any) => {
          if (response) {
            this.floors = this.mapResponseToFloors(response); // Map API response
          }
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
    }
    resetRooms() {
      this.isBooking = true; // Show loader and disable buttons
      this.responseMessage = 'Resetting rooms...';
  
      this.dataService.getData('room/addRoom').subscribe(
        (response: any) => {
          if (response) {
            this.fetchRooms();
            this.responseMessage = 'Rooms reset successfully!';
          }
          this.isBooking = false; // Hide loader
        },
        (error) => {
          console.error('Error resetting rooms:', error);
          this.responseMessage = 'Failed to reset rooms.';
          this.isBooking = false; // Hide loader
        }
      );
    }
  
    randomBook() {
      this.isBooking = true; // Show loader and disable buttons
      this.responseMessage = 'Randomly booking rooms...';
  
      this.dataService.getData('room/random').subscribe(
        (response: any) => {
          if (response) {
            this.fetchRooms();
            this.responseMessage = 'Rooms booked randomly!';
          }
          this.isBooking = false; // Hide loader
        },
        (error) => {
          console.error('Error randomly booking rooms:', error);
          this.responseMessage = 'Failed to randomly book rooms.';
          this.isBooking = false; // Hide loader
        }
      );
    }
     
    onBookRooms() {
      if (this.numberOfRooms < 6) {
        this.isBooking = true;
        this.responseMessage = 'Processing...';
  
        const payload = { rooms: this.numberOfRooms };
        this.dataService.postData('room/book', payload).subscribe(
          (response: any) => {
            this.numberOfRooms
            this.responseMessage = `${response.message} ${response.rooms}`;
            this.fetchRooms(); // Refresh the room data
          },
          (error) => {
            console.error('Error booking rooms:', error);
            this.responseMessage = 'Failed to book rooms. Please try again.';
          },
          () => {
            this.isBooking = false; // Re-enable the button after response
          }
        );
      } else {
        this.responseMessage = 'Please enter a valid number of rooms.';
      }
    }
   
    onRoomsChange(event: Event) {
      this.numberOfRooms = (event.target as HTMLInputElement).value;
      this.responseMessage = ''
      if (this.numberOfRooms > 5) {
        alert("You cannot book more than 5 rooms.");
      }
    }


  // Map API response to floors
  mapResponseToFloors(response: any): any[] {
    return Object.keys(response).map((floorKey) => ({
      floor: floorKey,
      rooms: response[floorKey]
    }));
  }

  // Get color based on room status
  getNumberColor(status: string): string {
    if (status === 'booked') {
      return '#EF4444'; // Red for booked
    } else if (status === 'available') {
      return '#22C55E'; // Green for available
    } else {
      return 'grey'; // Default color
    }
  }
}
