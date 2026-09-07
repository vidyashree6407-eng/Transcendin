# PayPal Integration Guide

## Local setup

1. Create a PayPal Developer account and open the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
2. Create a Sandbox REST app. Copy its **Client ID** and **Secret**.
3. Copy `.env.example` to `.env` and set:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox
```

4. Create a Sandbox personal buyer account in the PayPal dashboard. Use it in the checkout popup; do not use a real PayPal account for sandbox testing.
5. Install and start the services:

```powershell
npm install
node server.js
python -m http.server 8000
```

6. Open `http://localhost:8000/courses.html`, choose a course, and complete checkout with the Sandbox buyer account.

## Payment flow

1. The browser sends the validated enrollment details to `POST /api/enrollment/create`.
2. The server stores the complete enrollment as `PENDING_PAYMENT` in `data/enrollments/ENR-*.json`.
3. The browser asks `POST /api/enrollment/paypal/order` for an order ID. The server creates the PayPal order using the stored amount and enrollment ID.
4. PayPal handles the customer checkout in its hosted button.
5. After approval, the browser sends only the PayPal order ID to `POST /api/enrollment/verify-payment`.
6. The server captures the order through PayPal, checks `COMPLETED`, enrollment ID, country currency, and amount, then marks the record `PAID` and sends the confirmation email.

The PayPal secret stays on the server. Card details and other payment credentials are never stored by this application.

## Stored enrollment data

Each JSON record includes the submitted name, email, phone, address, message, course ID/name, selected-currency amount, USD/CAD/AUD currency, status, timestamps, PayPal order ID, capture ID, and payer ID/email when supplied by PayPal. Failed and abandoned payments remain stored with their status for follow-up.

## Go live

1. Create a PayPal Live app and replace the Sandbox credentials in the production environment.
2. Set `PAYPAL_ENV=live` and verify that every course price in the CSV is the intended numeric amount for the selected currency.
3. Set `ORIGIN` to the exact HTTPS production origin.
4. Serve the frontend and API over HTTPS, back up `data/enrollments/`, and restrict access to enrollment records before launch.
5. Run one small real transaction and verify the PayPal dashboard, JSON record, confirmation email, and refund process.

Never commit `.env`, PayPal secrets, or payment card data.

## Admin dashboard

Set these values in the private `.env` file before opening `http://localhost:8000/admin.html`:

```env
ADMIN_USERNAME=your_merchant_username
ADMIN_PASSWORD=use_a_long_unique_password
ADMIN_TOKEN_SECRET=use_a_long_random_secret
```

The admin page provides protected enrollment search, status filtering, customer/payment details, and CSV export. The session expires after eight hours. The student dashboard does not provide admin access.