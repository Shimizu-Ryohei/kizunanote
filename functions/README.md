# Firebase Functions

## Environment variables

- `OPENAI_API_KEY`
- `OPENAI_SUMMARY_MODEL` (optional, default: `gpt-4o-mini`)

## Function

- `summarizeProfilesDaily`
  - Runs every day at `05:00` in `Asia/Tokyo`
  - Reads profiles with `summaryStatus == "pending"`
  - Uses OpenAI Responses API to regenerate up to 5 summary bullets
  - Stores the result in `profiles/{profileId}/private/summary`
