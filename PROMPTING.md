# prompting-101 — how we structure Claude prompts in this repo

When you add a Claude-powered feature to WRF, follow this pattern. It's based on Anthropic's "Prompting 101" talk and proven on two features that already ship: `/staff/api/leads/[id]/draft-email` and `/staff/api/photo-intake/audit`.

The reference implementation outside this repo lives at `~/projects/prompting-101/`. This file is the WRF-specific guide.

## The shape

Every Claude feature in this repo should look like this:

```
src/app/(staff)/staff/api/<feature>/
  route.ts           ← HTTP handler. Plumbing only — no prompt text inline.
  prompts.ts         ← exports SYSTEM_PROMPT (cached) and USER_TEMPLATE (function).
```

`route.ts` does:

1. Auth check (`getStaffUserIdFromRequest`)
2. Validate input (file type/size, JSON shape)
3. Build the API call:
   - `model: "claude-opus-4-7"` (default — drop to `claude-sonnet-4-6` for cheap high-volume tasks)
   - `system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]`
   - `messages: [{ role: "user", content: [...dynamic input..., { type: "text", text: USER_TEMPLATE(args) }] }]`
   - For structured output: prefer XML tags inside the system prompt's "Output formatting" section, parse with regex on the way out. Use `output_config.format` only when you need a JSON schema enforced (see `draft-email/route.ts`).
4. Parse the response and return JSON

## The 10-section system prompt

Your `SYSTEM_PROMPT` constant in `prompts.ts` should have these labeled sections. They render as plain text to the model — the labels just keep you honest that you've covered each.

| # | Section | What goes here |
|---|---|---|
| 1 | Task context | Who Claude is, what it's doing, who reads the output, what cost-of-error looks like |
| 2 | Tone context | Be factual / cite evidence / no preamble / prefer "I don't know" over guessing |
| 3 | Background data | Everything that doesn't change between requests. Schemas, rubrics, business rules. **The bigger this is, the more caching saves.** |
| 4 | Detailed instructions | Step-by-step. Order matters — say what to read first, second, third. |
| 5 | Examples | XML-tagged few-shot. One clear case + one edge case where the answer is "uncertain". |
| 6 | Conversation history | Skip for single-turn features. |
| 7 | Immediate task | One-line restate. Lives in the user-turn template, not the system prompt. |
| 8 | Reasoning mode | Either bake order into section 4 (cheap), or set `thinking: { type: "adaptive" }` on the API call (better, slower). |
| 9 | Output formatting | XML tags or JSON schema. Stable across iterations so the parser doesn't break. |
| 10 | Reminders | Re-anchor the most load-bearing rules from sections 1–5. |

## What NOT to put in the system prompt

These are silent prompt-cache invalidators — every byte change anywhere in the prefix invalidates everything after it. Cache reads cost ~10% of cache writes, so any of these in the system prompt costs you real money:

- `Date.now()`, `new Date()`, current timestamps
- User IDs, request IDs, lead IDs
- Lead-specific facts (those go in the **user turn**, not the system prompt)
- Conditional sections that vary by feature flag

If something changes per request, it goes in the user turn. The system prompt is a frozen reference document.

## Verifying caching is working

Every `route.ts` returns `usage` in the response. Check the headers in the dev server log:

- First call: `cache_write_input_tokens` should equal the system prompt size, `cache_read_input_tokens` should be 0.
- Subsequent call within 5 min: `cache_read_input_tokens` should equal the system prompt size, `cache_write_input_tokens` should be 0.

If you see `cache_read_input_tokens: 0` across repeated calls, something in the system prompt is varying per request. Diff the rendered prompt bytes between two calls.

## Output parsing

Two options:

**XML tags (preferred for most things)**

In `system.ts`:

```
## 9. Output formatting

Return your analysis as exactly these XML blocks:

<verdict>HERO sports-memorabilia | EXTRA ... | REJECT — reason</verdict>
<caption>...</caption>
```

In `route.ts`:

```ts
const verdict = text.match(/<verdict>([\s\S]*?)<\/verdict>/)?.[1].trim() ?? "";
```

Pros: easier to debug (model output is human-readable), no schema-compilation latency, works with prefilled-instruction-style "Begin with `<verdict>`".

**JSON schema (when downstream consumer needs strict types)**

```ts
output_config: {
  format: {
    type: "json_schema",
    schema: { ... },
  },
}
```

See `leads/[id]/draft-email/route.ts` — the email subject + body need to render in a form, so a strict object shape is worth the schema.

## Don't put words in Claude's mouth

Opus 4.7 (and 4.6) **rejects assistant-turn prefills with a 400**. The talk's "put words in Claude's mouth" trick doesn't work anymore.

Instead, end the user prompt with `Begin with <verdict>` (or `Return ONLY a JSON object…`). This achieves the same lock-in.

## Don't pass `temperature` / `top_p` / `top_k`

Opus 4.7 returns 400 if you pass any of these. Just omit them.

## Existing examples in this repo

| Feature | File | What's good about it |
|---|---|---|
| Lead outreach email drafting | `src/app/(staff)/staff/api/leads/[id]/draft-email/route.ts` | Clear system prompt with shop positioning + tone rules. Strict JSON schema for parseable output. Reads website excerpt first to make the email specific. |
| Photo intake auditor | `src/app/(staff)/staff/api/photo-intake/audit/route.ts` + `prompts.ts` | Prompt extracted to sibling file. System prompt cached. XML-tag output. Two examples in section 5 (one clear-cut, one with defects). |

## When you're starting a new Claude feature

1. Pull up the reusable scaffold at `~/projects/prompting-101/03-template/PROMPT_TEMPLATE.md`.
2. Fill in each of the 10 sections for your use case.
3. Convert the markdown to a TypeScript constant in `<feature>/prompts.ts`.
4. Build `<feature>/route.ts` mirroring `photo-intake/audit/route.ts`.
5. Add to the staff sidebar if user-facing.
6. Add the feature to the table above.

## When you're tuning an existing prompt

The talk's loop:

1. Run the prompt on real data.
2. When it fails, identify which section failed (wrong tone? missed a rule? wrong format?).
3. Edit only that section.
4. Re-run.
5. Repeat until accuracy plateaus.

Add counter-examples to section 5 when you see a recurring failure mode. Two well-chosen examples close more failure modes than three more pages of instructions.
