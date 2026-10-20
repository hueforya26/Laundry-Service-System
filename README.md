# Fresh'n Klean Laundry Service

A small laundry-service dashboard for customer order tracking, employee order management, and monthly sales reporting.

## Features

- Customer queue with live status updates and a customer-service request form.
- Employee dashboard with order search, order creation, status updates, and deletion.
- Monthly sales chart based on recorded orders from the most recent 12 months.
- Responsive layouts for desktop and mobile screens.
- Light and dark themes with a saved preference across pages.
- Automatic order price estimates based on service and total weight.

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

## Order price estimates

The employee order form calculates an estimated total as weight multiplied by the selected service's per-kilogram rate. The rate tier is selected by total order weight (up to 5 kg, over 5 through 10 kg, or over 10 kg). Current editable rates are:

| Service | Up to 5 kg | Over 5 through 10 kg | Over 10 kg |
| --- | ---: | ---: | ---: |
| Wash & Dry | ₱60/kg | ₱55/kg | ₱50/kg |
| Full Service | ₱85/kg | ₱80/kg | ₱75/kg |
| Dry Clean | ₱120/kg | ₱115/kg | ₱110/kg |
| Ironing | ₱35/kg | ₱32/kg | ₱30/kg |

These are starter estimates and can be adjusted in `js/Employee.js` and the matching pricing guide in `Employee.html`. The calculated total is sent with the order to the API.

## Connect the pages to the API

The customer and employee pages connect to the existing hosted laundry API by default. To use a local or different API, set `window.LAUNDRY_API_URL` before the page scripts run. For example, add this before the page's JavaScript files:

```html
<script>window.LAUNDRY_API_URL = "http://localhost:3000";</script>
```

Serve the project directory with a static web server (rather than opening the HTML files directly) so browser requests can reach the API.

## Important

The employee sign-in is still a client-side demo flow inherited from the original project; it is not authentication and must be replaced with server-side authentication before exposing employee features publicly. Customer-service requests also require the configured EmailJS service and templates.
