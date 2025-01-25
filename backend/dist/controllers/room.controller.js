"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const redisHelper_1 = __importDefault(require("../redisHelper"));
class RoomController {
    constructor() {
        this.path = '/room';
        this.router = express.Router();
        this.intializeRoutes = () => {
            this.router.get(`${this.path}/addRoom`, this.addRoom);
            this.router.get(`${this.path}/fetchRoom`, this.fetchRoom);
            this.router.get(`${this.path}/random`, this.bookRandom);
            this.router.post(`${this.path}/book`, this.bookRoom);
        };
        this.addRoom = async (req, res) => {
            try {
                const result = await this.initialiseRoom();
                res.status(200).send({ message: result });
            }
            catch (error) {
                res.status(500).send(error.toString());
            }
        };
        this.fetchRoom = async (req, res) => {
            try {
                const keys = await redisHelper_1.default.client.keys('floor:*'); // Fetch all keys matching "floor:*"
                // Sort the keys to ensure floors are in sequence
                const sortedKeys = keys.sort((a, b) => {
                    const floorA = Number(a.split(':')[1]); // Extract floor number from "floor:X"
                    const floorB = Number(b.split(':')[1]);
                    return floorB - floorA; // Sort numerically
                });
                const allRooms = {};
                for (const key of sortedKeys) {
                    const rooms = await redisHelper_1.default.client.lRange(key, 0, -1);
                    // Parse and sort the rooms by room number
                    const sortedRooms = rooms.map(roomData => {
                        const [roomNumber, status] = roomData.split(':'); // Split room number and status
                        return {
                            roomNumber: Number(roomNumber), // Convert to integer
                            status: status // Keep the status as a string
                        };
                    }).sort((a, b) => a.roomNumber - b.roomNumber); // Sort by room number
                    // Add sorted rooms to the floor
                    allRooms[key] = sortedRooms;
                }
                res.status(200).send(allRooms); // Send the sorted response
            }
            catch (error) {
                res.status(500).send(error);
            }
        };
        this.bookRoom = async (req, res) => {
            try {
                const roomsToBook = req.body.rooms;
                const availableRooms = {}; // Rooms grouped by floor
                const vacantRoomCount = {}; // Track vacant room counts per floor
                const keys = await redisHelper_1.default.client.keys('floor:*');
                // Fetch vacant room counts and available rooms by floor
                for (const key of keys) {
                    // Get vacant room count for the floor
                    const vacantCount = await redisHelper_1.default.client.get(`${key}:vacantRoomCount`);
                    vacantRoomCount[key] = parseInt(vacantCount) || 0;
                    // Retrieve all rooms on the floor
                    const rooms = await redisHelper_1.default.client.lRange(key, 0, -1);
                    availableRooms[key] = rooms
                        .map(roomData => {
                        const [roomNumber, status] = roomData.split(':');
                        return status === "available" ? parseInt(roomNumber) : null;
                    })
                        .filter(roomNumber => roomNumber !== null);
                }
                let bookedRooms = [];
                let selectedFloor = null;
                // Priority 1: Try to book on the same floor (minimize horizontal travel)
                for (const floorKey of Object.keys(vacantRoomCount)) {
                    const vacantCount = vacantRoomCount[floorKey];
                    if (vacantCount >= roomsToBook) {
                        // Book rooms on the same floor
                        bookedRooms = availableRooms[floorKey].slice(0, roomsToBook);
                        selectedFloor = floorKey;
                        break;
                    }
                }
                if (bookedRooms.length === 0) {
                    // Priority 2: If not enough rooms on one floor, book rooms across multiple floors
                    bookedRooms = this.selectRoomsAcrossFloors(availableRooms, roomsToBook);
                }
                // Mark rooms as booked
                for (const roomNumber of bookedRooms) {
                    await this.updateRoomStatus(roomNumber, 'booked');
                }
                res.status(200).send({ message: `Successfully booked ${bookedRooms.length} rooms.`, rooms: bookedRooms });
            }
            catch (error) {
                console.error('Error booking rooms:', error);
                throw error;
            }
        };
        this.bookRandom = async (req, res) => {
            try {
                const result = await this.generateRandomOccupancy();
                res.status(200).send({ message: result });
            }
            catch (error) {
                res.status(500).send(error.toString());
            }
        };
        this.intializeRoutes();
    }
    async initialiseRoom() {
        try {
            const floors = {};
            const vacantRoomCount = {}; // Track the vacant room count for each floor
            // Create rooms for floors 1-9
            for (let floor = 1; floor <= 9; floor++) {
                const floorRooms = {};
                for (let room = 1; room <= 10; room++) {
                    const roomNumber = floor * 100 + room; // e.g., 101, 102, ..., 910
                    floorRooms[roomNumber] = "available"; // Set initial status for each room
                }
                floors[`floor:${floor}`] = floorRooms;
                vacantRoomCount[`floor:${floor}`] = 10; // All rooms are initially available
            }
            // Create rooms for floor 10
            const floor10Rooms = {};
            for (let room = 1; room <= 7; room++) {
                const roomNumber = 1000 + room; // e.g., 1001, 1002, ..., 1007
                floor10Rooms[roomNumber] = "available"; // Set initial status for each room
            }
            floors['floor:10'] = floor10Rooms;
            vacantRoomCount['floor:10'] = 7; // All rooms are initially available
            // Store data in Redis
            for (const [floorKey, rooms] of Object.entries(floors)) {
                // Clear existing data for the floor
                await redisHelper_1.default.client.del(floorKey);
                // Store the rooms as a list (each room as 'roomNumber:status')
                await redisHelper_1.default.client.rPush(floorKey, Object.entries(rooms).map(([roomNumber, status]) => `${roomNumber}:${status}`));
                // Store the vacant room count in a separate key
                await redisHelper_1.default.client.set(`vacantRoomCount:${floorKey}`, vacantRoomCount[floorKey]);
            }
            return ('Rooms have been initialized in Redis with vacant room count.');
        }
        catch (error) {
            throw error;
        }
    }
    async generateRandomOccupancy() {
        try {
            // Initialize the rooms
            await this.initialiseRoom();
            console.log('All rooms reset');
            // Get all floor keys (excluding vacant room count keys)
            const keys = await redisHelper_1.default.client.keys('floor:*'); // Fetch only floor keys
            // Iterate over each floor key
            for (const key of keys) {
                // Retrieve current rooms on the floor (as a list of room statuses)
                const rooms = await redisHelper_1.default.client.lRange(key, 0, -1);
                let vacantCount = 0; // To track the number of vacant rooms on the floor
                // Map rooms to their new status: "booked" or "available"
                const updatedRooms = rooms.map(roomData => {
                    const [roomNumber, status] = roomData.split(':'); // Extract room number and current status
                    const isBooked = Math.random() > 0.5; // Randomly decide if the room is booked
                    // Update vacant count based on room status
                    if (!isBooked)
                        vacantCount++;
                    // Return updated room status
                    return `${roomNumber}:${isBooked ? 'booked' : 'available'}`;
                });
                // Clear existing data for the floor (rooms)
                await redisHelper_1.default.client.del(key);
                // Ensure updatedRooms is an array of strings
                if (updatedRooms && Array.isArray(updatedRooms)) {
                    // Use rPush correctly by passing the key and the array of updated room statuses
                    await redisHelper_1.default.client.rPush(key, updatedRooms);
                    console.log(`Randomly updated occupancy on ${key}.`);
                }
                else {
                    throw new Error(`Error: Updated rooms for ${key} is not a valid array.`);
                }
                // Update vacant room count with the new key format
                const vacantRoomCountKey = `vacantRoomCount:${key}`; // New key format
                await redisHelper_1.default.client.set(vacantRoomCountKey, vacantCount.toString());
                console.log(`Vacant room count for ${key} updated to ${vacantCount}.`);
            }
            return 'Random room occupancy generation complete.';
        }
        catch (error) {
            console.error('Error generating random occupancy:', error);
            throw error;
        }
    }
    selectRoomsAcrossFloors(availableRooms, roomsToBook) {
        let roomsBooked = [];
        let roomsRemaining = roomsToBook;
        // Ensure floors are processed from lowest to highest (1st floor to last floor)
        const floors = Object.keys(availableRooms).sort((a, b) => {
            return parseInt(a.split(':')[1]) - parseInt(b.split(':')[1]); // Sorting floors numerically
        });
        for (const floorKey of floors) {
            const roomsOnFloor = availableRooms[floorKey];
            const roomsToTake = roomsOnFloor.slice(0, roomsRemaining); // Take available rooms
            roomsBooked = roomsBooked.concat(roomsToTake);
            roomsRemaining -= roomsToTake.length;
            if (roomsRemaining === 0) {
                break; // Exit early if we've booked all required rooms
            }
        }
        return roomsBooked;
    }
    async updateRoomStatus(roomNumber, status) {
        // Update room status in Redis
        const floorKey = `floor:${Math.floor(roomNumber / 100)}`; // Get floor key based on room number
        const roomData = `${roomNumber}:${status}`;
        // Remove room from available and add it to booked
        await redisHelper_1.default.client.lRem(floorKey, 0, `${roomNumber}:available`);
        await redisHelper_1.default.client.rPush(floorKey, roomData);
        console.log(`Room ${roomNumber} is now ${status}`);
    }
}
exports.default = RoomController;
//# sourceMappingURL=room.controller.js.map