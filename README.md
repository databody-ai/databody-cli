# DataBody CLI

A command-line interface for [DataBody](https://databody.ai) health and fitness tracking, designed for local LLM tool use. All commands output JSON for easy parsing.

## Installation

```bash
npm install -g @databody/cli
```

Or run directly:

```bash
npx @databody/cli <command>
```

## Authentication

### Browser OAuth (recommended)

```bash
databody auth login
```

Opens your browser for secure OAuth login. Tokens are saved to `~/.databody_token.json`.

### Cross-machine auth

Authenticate on one machine and transfer the token to another:

```bash
# Machine A (has your account):
databody auth login
databody auth export-token --compact
# → prints a base64 string

# Machine B:
databody auth import-token <base64_string>
```

Or set a token directly:

```bash
databody auth login --token <access_token> --refresh-token <refresh_token>
```

### Other auth methods

```bash
databody auth login --password -e user@example.com -p secret  # Password grant
databody auth status                                           # Check auth status
databody auth logout                                           # Clear tokens
```

## Quick Start

```bash
databody summary                    # Today's health summary
databody today                      # Today's nutrition logs
databody chat "What should I eat?"  # Chat with AI coach
databody log breakfast '[{"name":"eggs","calories":140,"protein_grams":12,"carbs_grams":1,"fat_grams":10}]'
```

## Commands

### Health

```bash
databody health summary              # Dashboard: macros, goals, workouts, trends
databody health history --days 90    # Historical health stats
```

### Nutrition

```bash
databody nutrition today
databody nutrition history --start 2026-01-01 --end 2026-01-31
databody nutrition get <log_id>
databody nutrition log --meal breakfast --items '[{...}]'
databody nutrition log --meal lunch --stdin           # Read items from stdin
databody nutrition update <log_id> --meal lunch
databody nutrition delete <log_id>
databody nutrition add-item <log_id> --name "toast" --calories 80 --protein 3 --carbs 15 --fat 1
databody nutrition delete-item <log_id> <item_id>
```

### Food Search

```bash
databody food search "chicken breast"
databody food search "yogurt" --source usda --page 2
databody food details <food_id>
databody food barcode <barcode>
databody food favorites
databody food add-favorite --name "Greek Yogurt" --calories 100 --protein 17 --carbs 6 --fat 1
databody food remove-favorite <id>
databody food recents
```

### Goals

```bash
databody goals current
databody goals list
databody goals create --calories 2000 --protein 180 --carbs 200 --fat 67 --strategy cut
databody goals update <id> --calories 2200
databody goals delete <id>
databody goals calculate <id>        # Recalculate from current health data
```

### Workouts

```bash
databody workouts recent --limit 20
databody workouts list --start 2026-01-01 --type running
databody workouts create --type running --started-at 2026-03-14T08:00:00Z --duration 45 --calories 400
databody workouts update <id> --calories 450
databody workouts delete <id>
```

### AI

```bash
databody ai chat "What should I eat for dinner?"
databody ai chat "Plan meals" --thread 5 --household 1
databody ai suggestions --preferences "low carb"
databody ai analyze-photo --file /path/to/meal.jpg
databody ai parse "2 eggs with toast and butter"
databody ai expand --meal "Stir Fry" --ingredients "chicken,broccoli,rice"
databody ai greeting
databody ai token-usage
databody ai chat-history --thread 5
```

### Chat Threads

```bash
databody threads list
databody threads get <id>
databody threads create --title "Meal Planning"
databody threads delete <id>
databody threads generate-title <id>
```

### Notes

```bash
databody notes list
databody notes create "I have a home gym with dumbbells"
databody notes update <id> "Updated note"
databody notes delete <id>
```

### Households

```bash
databody households list
databody households summary <id> --days 7
databody households create "Family Name"
databody households update <id> --name "New Name"
databody households delete <id>
databody households members <id>
databody households remove-member <id> <member_id>
```

### Invites

```bash
databody invites list <household_id>
databody invites pending
databody invites create <household_id> --email "partner@example.com"
databody invites accept <id>
databody invites decline <id>
```

### User Profile

```bash
databody user profile
databody user update --name "Nick" --timezone "America/New_York"
databody user change-password --current "old" --new "new"
databody user change-email --password "pass" --email "new@example.com"
```

## Output

All commands output JSON to stdout. Use `--pretty` for formatted output:

```bash
databody health summary --pretty
```

Exit codes:
- `0` — Success
- `1` — API or application error
- `2` — Authentication required

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABODY_API_URL` | DataBody API URL | `http://localhost:3000` |
| `DATABODY_CALLBACK_PORT` | OAuth callback port | `8787` |

For production use:

```bash
export DATABODY_API_URL=https://databody.ai
```

## Development

```bash
git clone https://github.com/databody-ai/databody-cli.git
cd databody-cli
npm install
npm run build
npm link              # Makes 'databody' available globally

npm run dev           # Watch mode
npm run typecheck     # Type checking
npm test              # Run tests
```

## Links

- [DataBody App](https://databody.ai)
- [DataBody MCP Server](https://github.com/databody-ai/databody-mcp)
- [GitHub Issues](https://github.com/databody-ai/databody-cli/issues)
