# Paya Marketplace - Merchant Portal

## Setup

### Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   - `REACT_APP_API_URL`: Your backend API URL (default: http://localhost:5001/api)
   - `REACT_APP_EXTERNAL_API_KEY`: Your Paya External API key (required for merchant onboarding)

### Getting the External API Key

The External API key is required for merchant onboarding functionality. Contact your Paya administrator to obtain your API key.

⚠️ **Important Security Notes:**
- Never commit the `.env` file to version control
- Store API keys securely
- Use different keys for development and production environments

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will start on `http://localhost:3000`

## Features

- **Merchant Onboarding**: Complete multi-step onboarding process integrating with Paya External API
- **Product Management**: Add and manage products
- **Order Management**: View and process customer orders
- **Shopify Integration**: Connect your Shopify store
- **Account Management**: Manage business information and settings

## External API Integration

The merchant onboarding process uses the Paya External API to:
1. Create organization owners
2. Register organizations
3. Upload business documents
4. Add directors and their documents
5. Track approval status

For detailed API documentation, see `src/EXTERNAL_API_GUIDE.md`
