# Chat - Connect Across Languages

A real-time chat application with instant language translation, built with TanStack Router and Convex.

**Live at:** <https://chat.efobi.dev>

## Features

- **Real-time messaging** with instant delivery
- **Language translation** powered by AI
- **Multi-language support** for global conversations
- **Group and private chats**
- **Responsive design** for all devices

## Getting Started

To run this application:

```bash
bun install
bun run dev
```

## Building For Production

To build this application for production:

```bash
bun run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
bun run test
```

## Tech Stack

- **Frontend**: React 19 with TanStack Router
- **Backend**: Convex for real-time database and functions
- **Styling**: Tailwind CSS
- **Authentication**: Auth0
- **Language Translation**: AI-powered translation
- **Deployment**: Cloudflare Workers
- **Error Monitoring**: Sentry

## Architecture

This project uses [TanStack Router](https://tanstack.com/router) with a file-based routing system. Routes are defined as files in `src/routes/`.

## Deployment

This application is configured for deployment on Cloudflare Workers with Convex backend.

```bash
bun run deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test`
5. Submit a pull request

## License

This project is licensed under the MIT License.
