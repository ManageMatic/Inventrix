// Get the current hostname from the browser
const hostname = window.location.hostname;

// Define backend and socket URLs dynamically based on the current hostname
// This ensures that whether we are on localhost or a local IP (e.g. 10.x.x.x),
// the frontend will always point to the correct backend IP on port 5000.
export const API_URL = `http://${hostname}:5000`;
export const SOCKET_URL = `http://${hostname}:5000`;
export const CLIENT_URL = `http://${hostname}:3000`;
