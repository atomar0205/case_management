# lawconnect

This full-stack online case management system enables clients to submit and track legal cases, lawyers to manage case requests, and administrators to oversee users, cases, and Jansabha disputes.

## Features

- Role-based access for clients, lawyers, and administrators
- Client registration, login, case submission, and case tracking
- Lawyer case review, acceptance, rejection, and status management
- Administrator dashboards for managing users, cases, and disputes
- Jansabha panel for handling smaller dispute-resolution requests
- JWT-based authentication and protected API routes

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Authentication | JSON Web Tokens, bcryptjs |
| Data storage | In-memory seed data |

## Project Structure

```text
lawconnect/
|-- frontend/
|   |-- index.html
|   |-- style.css
|   `-- js/app.js
`-- backend/
    |-- server.js
    |-- db.js
    |-- middleware/auth.js
    `-- routes/
```

## Run Locally

1. Start the backend:

   ```bash
   cd backend
   npm install
   npm start
   ```

   The API runs at `http://localhost:5000`.

2. Serve the frontend on port 3000 (or use a Live Server on port 5500):

   ```bash
   cd frontend
   python -m http.server 3000
   ```

3. Open `http://localhost:3000` in a browser.

For backend auto-restart during development, run `npm run dev` from the `backend` directory.

## API Overview

| Area | Base route | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Registration, login, and current-user access |
| Cases | `/api/cases` | Case creation, retrieval, status updates, and deletion |
| Jansabha | `/api/jansabha` | Dispute submission and resolution workflow |
| Lawyers | `/api/lawyers` | Lawyer listing and profile/status management |
| Clients | `/api/clients` | Client profile and administration |
| System | `/api/health`, `/api/stats` | Service health and dashboard statistics |

## Notes

- The application uses in-memory data, so changes reset when the backend restarts.
- CORS is configured for `http://localhost:3000` and `http://localhost:5500`.
