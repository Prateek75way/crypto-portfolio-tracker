


# Crypto Portfolio Tracker 

A backend application for managing and tracking cryptocurrency portfolios. This application integrates with the CoinGecko API to fetch real-time cryptocurrency prices, calculate profit and loss (P&L) for a portfolio, and support various features such as transaction tracking, portfolio updates, and price alerts.

## Features

- **Real-time price tracking**: Fetch live cryptocurrency prices from the CoinGecko API.
- **Portfolio management**: Track and manage your cryptocurrency holdings.
- **Profit and Loss calculation**: Calculate and monitor P&L based on historical transactions.
- **Transaction handling**: Support for buying, selling, and transferring cryptocurrencies.
- **Price alerts**: Set alerts to notify users when cryptocurrency prices cross a specified threshold.

## Prerequisites

- **Node.js** (v16 or later)
- **MongoDB** instance (local or remote)
- **Nodemailer** setup for email alerts

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/crypto-portfolio-tracker.git
    cd crypto-portfolio-tracker
    ```

2. Install the dependencies:

    ```bash
    pnpm install
    ```

3. Set up environment variables:
    
    Create a `.env` file in the root of the project and configure the following variables:

    ```plaintext
    PORT=3000
    MONGO_URI=<your-mongodb-uri>
    COINGECKO_API_KEY=<your-coingecko-api-key>
    JWT_SECRET=<your-jwt-secret>
    MAIL_HOST=<smtp-mail-server>
    MAIL_PORT=<smtp-port>
    MAIL_USER=<your-mail-user>
    MAIL_PASS=<your-mail-password>
    ```

## Scripts

### Start server in production mode:
  
```bash
pnpm run prod
```

### Start server in development mode (with hot reloading):

```bash
pnpm run dev
```

### Build TypeScript files:

```bash
pnpm run build
```

### Run linting checks:

```bash
pnpm run lint
```

### Format code with Prettier:

```bash
pnpm run format
```

### Fix linting issues:

```bash
pnpm run lint:fix
```



