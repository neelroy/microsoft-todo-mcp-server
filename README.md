# Microsoft To Do MCP

[![npm version](https://badge.fury.io/js/mstodo-mcp-server.svg)](https://www.npmjs.com/package/mstodo-mcp-server)

A Model Context Protocol (MCP) server that enables AI assistants like Claude and Cursor to interact with Microsoft To Do via the Microsoft Graph API. This service provides comprehensive task management capabilities through a secure OAuth 2.0 authentication flow.

## Features

- **16 MCP Tools**: Complete task management including lists, tasks, checklist items, bulk archiving, and organized views
- **Task Creation Timestamps**: Surfaces `createdDateTime` on all tasks so you can see when each was added
- **Smart Organized Views**: Groups task lists by naming patterns, emoji prefixes, and sharing status
- **Bulk Archive**: Move completed tasks older than N days to an archive list, with dry-run preview
- **Seamless Authentication**: Automatic token refresh with zero manual intervention
- **OAuth 2.0**: Secure authentication via MSAL with PKCE flow
- **Microsoft Graph API v1.0**: Direct integration with Microsoft's official API
- **Multi-tenant Support**: Works with personal, work, and school Microsoft accounts
- **TypeScript + ESM**: Fully typed, modern module system

## Prerequisites

- Node.js 16 or higher (tested with Node.js 18.x, 20.x, and 22.x)
- A Microsoft account (personal, work, or school)
- Azure App Registration (see setup below)

## Installation

### Quickstart with npx (Recommended)

No installation needed — just configure Claude Desktop to run the server via npx:

```json
{
  "mcpServers": {
    "microsoftTodo": {
      "command": "npx",
      "args": ["--yes", "mstodo-mcp-server@latest"],
      "env": {
        "ACCESS_TOKEN": "your_access_token",
        "REFRESH_TOKEN": "your_refresh_token",
        "CLIENT_ID": "your_client_id",
        "CLIENT_SECRET": "your_client_secret",
        "TENANT_ID": "your_tenant_id"
      }
    }
  }
}
```

### Global Installation

```bash
npm install -g mstodo-mcp-server
```

The package provides these command aliases:

- `mstodo-mcp-server` — main entry point (matches package name for npx)
- `mstodo` — short alias
- `mstodo-config` — configuration helper
- `mstodo-setup` — guided setup wizard

### Clone and Run Locally

```bash
git clone https://github.com/neelroy/microsoft-todo-mcp-server.git
cd microsoft-todo-mcp-server
pnpm install
pnpm run build
```

## Azure App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **App registrations** → **New registration**
3. Name your application (e.g., "TodoMCP")
4. Choose the appropriate account type for your needs
5. Set the Redirect URI to `http://localhost:3000/callback`
6. Under **Certificates & secrets**, create a new client secret
7. Under **API permissions**, add Microsoft Graph delegated permissions:
   - `Tasks.Read`
   - `Tasks.ReadWrite`
   - `Tasks.Read.Shared`
   - `Tasks.ReadWrite.Shared`
   - `User.Read`
8. Click **Grant admin consent**

## Configuration

### Environment Variables

| Variable | Description |
|---|---|
| `ACCESS_TOKEN` | Microsoft Graph access token |
| `REFRESH_TOKEN` | Refresh token for automatic renewal |
| `CLIENT_ID` | Azure App Registration client ID |
| `CLIENT_SECRET` | Azure App Registration client secret |
| `TENANT_ID` | Tenant ID or `organizations` / `consumers` / `common` |
| `MSTODO_TOKEN_FILE` | Custom path for `tokens.json` (optional) |

### TENANT_ID Options

```env
TENANT_ID=organizations          # Work/school accounts (multi-tenant)
TENANT_ID=consumers              # Personal Microsoft accounts only
TENANT_ID=common                 # Both work and personal accounts
TENANT_ID=00000000-0000-0000-0000-000000000000  # Single tenant
```

### Authentication Flow

Run the auth server to obtain tokens interactively:

```bash
pnpm run auth   # Opens browser for Microsoft login, writes tokens.json
pnpm run create-config  # Generates mcp.json from tokens.json
```

Tokens are automatically refreshed 5 minutes before expiration.

## Claude Desktop Setup

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "microsoftTodo": {
      "command": "npx",
      "args": ["--yes", "mstodo-mcp-server@latest"],
      "env": {
        "ACCESS_TOKEN": "your_access_token",
        "REFRESH_TOKEN": "your_refresh_token",
        "CLIENT_ID": "your_client_id",
        "CLIENT_SECRET": "your_client_secret",
        "TENANT_ID": "your_tenant_id"
      }
    }
  }
}
```

Restart Claude Desktop after saving. The server will be downloaded and started automatically.

## MCP Tools

### Authentication

| Tool | Description |
|---|---|
| `auth-status` | Check token status and expiration |

### Task Lists

| Tool | Description |
|---|---|
| `get-task-lists` | All lists with metadata; supports `sortBy` (displayName) and `sortOrder` |
| `get-task-lists-organized` | Lists grouped by naming pattern, emoji prefix, and sharing status |
| `create-task-list` | Create a new list |
| `update-task-list` | Rename a list |
| `delete-task-list` | Delete a list and all its tasks |

### Tasks

| Tool | Description |
|---|---|
| `get-tasks` | Tasks from a list with OData support: `$orderby`, `$top`, `$skip`, `$filter`, `$select` |
| `create-task` | Create a task (title, body, due date, importance, reminder, categories) |
| `update-task` | Update any task properties |
| `delete-task` | Delete a task and its checklist items |

**Task output includes:**
- Title, status (○ / ✓), importance, due date
- `createdDateTime` — when the task was added
- `lastModifiedDateTime`, body preview, categories, attachments flag

### Checklist Items (Subtasks)

| Tool | Description |
|---|---|
| `get-checklist-items` | Get subtasks for a task |
| `create-checklist-item` | Add a subtask |
| `update-checklist-item` | Update subtask text or completion |
| `delete-checklist-item` | Remove a subtask |

### Bulk Operations

| Tool | Description |
|---|---|
| `archive-completed-tasks` | Move completed tasks older than N days to an archive list. Supports `dryRun` to preview before committing |

## Graph API Notes

The Microsoft Graph `todoTask` API has some quirks worth knowing:

- **`title` is not selectable**: Passing `title` in `$select` returns a 400 error, but the API always returns it anyway. The server handles this automatically.
- **`$filter` on `createdDateTime` is unsupported**: Use `$orderby=createdDateTime desc` and filter client-side.
- **Complex types can't be in `$select`**: Fields like `recurrence` and `startDateTime` are excluded from the default select.

## Architecture

```
src/
├── todo-index.ts       # MCP server — all 16 tools
├── cli.ts              # CLI entry point with token loading
├── auth-server.ts      # OAuth 2.0 / MSAL auth flow (port 3000)
├── create-mcp-config.ts # Generates mcp.json from tokens.json
├── setup.ts            # Guided setup wizard
└── token-manager.ts    # Token refresh logic
```

Build system: [tsup](https://tsup.egoist.dev/) — version is auto-injected from `package.json` at build time.

## Development

```bash
pnpm install
pnpm run build       # Compile TypeScript → dist/
pnpm run dev         # Build + run CLI
pnpm run auth        # Start OAuth server on :3000
pnpm run typecheck   # Type check without building
pnpm run format      # Format with Prettier
```

## Limitations

### Personal Microsoft Accounts

Personal accounts (outlook.com, hotmail.com, live.com) may encounter `MailboxNotEnabledForRESTAPI` errors. This is a Microsoft service limitation — work/school accounts have full API access.

### API Limits

- Standard Microsoft Graph rate limits apply
- `$filter` support on `todoTask` is limited (status, importance, dueDateTime work; createdDateTime does not)

## Troubleshooting

**`could not determine executable to run`** — The `npx` cache may have a stale version. Clear it:
```bash
rm -rf ~/.npm/_npx
```
Then restart Claude Desktop.

**Token expired errors** — Tokens auto-refresh, but if the refresh token itself expires, re-run `pnpm run auth`.

**`RequestBroker--ParseUri` from Graph API** — Usually caused by invalid field names in `$select`. The server's default select list is pre-validated against the API.

## License

MIT License — See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Fork of [@jhirono/todomcp](https://github.com/jhirono/todomcp) via [jordanburke/microsoft-todo-mcp-server](https://github.com/jordanburke/microsoft-todo-mcp-server)
- Built on the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [Microsoft Graph API](https://developer.microsoft.com/en-us/graph)

## Links

- [npm Package](https://www.npmjs.com/package/mstodo-mcp-server)
- [GitHub](https://github.com/neelroy/microsoft-todo-mcp-server)
- [Issues](https://github.com/neelroy/microsoft-todo-mcp-server/issues)
