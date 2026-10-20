# Fresh'n Klean Laundry Service

A small laundry-service dashboard for customer order tracking, employee order management, and monthly sales reporting.

## Features

- Customer queue with live status updates and a customer-service request form.
- Employee dashboard with order search, order creation, status updates, and deletion.
- Monthly sales chart based on recorded orders from the most recent 12 months.
- Responsive layouts for desktop and mobile screens.
- Light and dark themes with a saved preference across pages.

## Run the backend

Install the backend dependencies and start the API:

```sh
cd backend
npm install
npm start
```

Configure these environment variables before starting the server:

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database |
| `DB_PORT` | MySQL port (defaults to the driver's standard port) |
| `PORT` | API port (defaults to `3000`) |

The API provides `GET /customers` for today's queue, `GET /customers?scope=all` for the employee dashboard and sales chart, `POST /addCustomer`, `PUT /updateStatus/:id`, and `DELETE /deleteCustomer/:id`.

## Connect the pages to the API

The front end uses `http://localhost:3000` by default. To use a hosted or different API, set `window.LAUNDRY_API_URL` before the page scripts run. For example, add this before the page's JavaScript files:

```html
<script>window.LAUNDRY_API_URL = "http://localhost:3000";</script>
```

Serve the project directory with a static web server (rather than opening the HTML files directly) so browser requests can reach the API.

## Important

The employee sign-in is still a client-side demo flow inherited from the original project; it is not authentication and must be replaced with server-side authentication before exposing employee features publicly. Customer-service requests also require the configured EmailJS service and templates.
