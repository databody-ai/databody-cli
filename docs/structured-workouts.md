# Structured workout commands

These commands require the DataBody workout-training API. Existing `workouts list`, `create`, `update` and `delete` activity-summary commands remain available.

## One-offs

`workouts one-offs list` returns available plans and the account's `time_zone` and `fetched_at`. Use those to resolve “today” or “tomorrow,” and check the move library before scheduling. Set `scheduled_on` to the desired account-local date (`YYYY-MM-DD`) and supply ordered moves and set targets.

```sh
databody workouts schema create_workout_one_off
databody workouts one-offs list
databody workouts one-offs create --file one-off.json --client-id full-body-2026-11-23
databody workouts one-offs update --one-off-id 42 --expected-revision 0 --scheduled-on 2026-11-24
databody workouts one-offs remove --one-off-id 42 --expected-revision 1
databody workouts sessions list --kind one_off
```

For example, `one-off.json` can contain the following. Substitute the intended date, your library move IDs, and your planned set targets.

```json
{
  "name": "Full Body",
  "scheduled_on": "2026-11-23",
  "moves": [
    {
      "move_id": 7,
      "sets": [
        { "reps_min": 8, "reps_max": 10, "weight": 95, "rest_seconds": 90 }
      ]
    }
  ]
}
```

Keep the same `client_id` on retries. Use the listed ID and revision for edits and removals. A date-only edit preserves the moves. The user starts the saved plan in the iPhone or Watch One-offs picker. After completion it appears in Lift under **History → One-offs**.

## Programs, sessions, and moves

```sh
databody workouts schema create_workout_program
databody workouts programs list
databody workouts programs create --file program.json
databody workouts programs get --program-id 1
databody workouts moves list
databody workouts moves create --name "Bench Press" --unit lb --load-basis total
databody workouts moves history --move-id 1
databody workouts sessions start --program-id 1 --day-id upper-a --client-id session-uuid
databody workouts sessions active
databody workouts sets log --session-id 1 --expected-revision 0 --client-id log-uuid --set-id SET_UUID --reps 8 --weight 135
databody workouts sets weight --session-id 1 --expected-revision 1 --set-id NEXT_SET_UUID --weight 140 --remaining true
databody workouts sessions next --session-id 1 --expected-revision 2
databody workouts sessions pause --session-id 1 --expected-revision 3
databody workouts sessions resume --session-id 1 --expected-revision 4
databody workouts sessions complete --session-id 1 --expected-revision 5
databody workouts progression get --session-id 1
databody workouts progression apply --session-id 1 --expected-revision 0 --move-ids '["bench"]'
databody workouts sessions import --file notes-workout.json

# Current session and library features
databody workouts sessions notes --session-id 1 --expected-revision 6 --notes "Keep the last set controlled"
databody workouts sessions move-notes --session-id 1 --expected-revision 7 --move-id bench --notes "Use a neutral grip"
databody workouts sessions rest --session-id 1 --expected-revision 8
databody workouts sessions replace-move --session-id 1 --expected-revision 9 --move-id bench --file replacement.json
databody workouts sets remove --session-id 1 --expected-revision 10 --set-id PENDING_SET_UUID
databody workouts sessions remove-move --session-id 1 --expected-revision 11 --move-id pending-move
databody workouts moves update --move-id 1 --variation-ids '[2,3]'
databody workouts moves performance --move-id 1
databody workouts sessions performance --session-id 1
```

Read each returned `revision` and supply it as `--expected-revision` for the next edit. A progression application uses the current **program** revision; other session actions use the session revision. A 409 means reload before retrying. Explicitly supply stable `--client-id` values for safely retrying starts, imports and commands. A retry keeps the same command data, including its event time. Omitted client IDs are generated for that invocation.

Every action supports `--json '{...}'`, `--file path` or `--file -` (stdin); typed flags override those fields. Boolean flags take `true` or `false`; arrays/objects take JSON. `databody workouts schema` returns every schema, or pass a tool name to inspect one. This works offline without authentication. The schemas are copied from the Rails repository's canonical `config/workout_tools.json`.

The npm package includes `examples/lift-program.json`, a complete two-day example. Its weights and rep ranges are illustrative; replace them with the user's actual instructions. Read the existing program list before creating a program to avoid duplicates. Keep all existing day/move IDs and any days that should remain when editing, because a supplied `days` array replaces the complete program layout.

Program JSON has `name` and `days`, each day containing a stable string `id`, `name`, and `moves`. Each move has a stable occurrence `id`, a `name` (or existing numeric library `move_id`), `unit`, `load_basis`, `increment`, and `sets`. Each target supplies `reps_min`, `reps_max`, `weight`, and `rest_seconds`.

Historical imports supply `client_id`, `started_at`, `ended_at`, `moves`, and `completed_sets`. Actual sets reference the supplied occurrence `move_id` and one-based `set_number`, with `reps` and `weight`. Use timestamps with UTC offsets and import only known facts. Notes extraction is performed by the caller; this command accepts structured records.

Session and move notes accept up to 2,000 characters; pass an empty string to clear them. Move notes update the reusable library move. Removing a set or move preserves completed actuals. Replacements affect the remaining unlogged sets of one session occurrence, preserving the saved program. `replacement.json` supplies a `move` prescription; inspect `databody workouts schema replace_workout_session_move` for its nested fields. Linked `variation_ids` identify other library moves; an empty array clears the links.
