# Belora AI Candle Store

This is a deployable Belora candle store starter.

## What it does
- Customers see all candles you publish.
- You upload candle photos and details from the built-in **Belora Studio** section.
- Products appear immediately in the shop.
- Customers add products to cart.
- Customers enter delivery details and place an order.
- Orders are saved on the server in `data/orders.json`.
- Product images are saved in `uploads/`.

## Run
1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Going live
Deploy the Node app to a host such as Render/Railway/Fly.io. For production, use a managed database/object storage rather than local JSON/files if your host has ephemeral storage.

## Online payment
This starter intentionally leaves payment off so you can first test the catalogue and ordering flow. Razorpay can be connected next with server-side order creation and payment verification.

## AI
The storefront is AI-designed and structured so an AI description generator can be added to the Belora Studio. For a production AI feature, keep any AI API key on the server, never in browser code.
