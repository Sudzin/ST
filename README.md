# File Transfer App

## How to Run Locally

1.  **Install Node.js**: Ensure you have Node.js installed (v18 or higher recommended).
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Server**:
    ```bash
    npm run dev
    ```
    This will start the backend server on port 3000 and the frontend.

4.  **Open in Browser**:
    Go to `http://localhost:3000`

## Features
-   User Authentication (Login/Register)
-   File Upload via WebSocket (Chunked)
-   Admin Dashboard (Stats, Logs)
-   SQLite Database

## Project Structure
-   `server.ts`: Main Express + WebSocket server
-   `src/`: Frontend React code
-   `uploads/`: Directory where uploaded files are stored
-   `data.db`: SQLite database file (created automatically)
