# Setup

Ask these in order, one plain sentence at a time.

## Step 0.1 — Template type

"Which template type are you building — ecommerce, tour, hotel, or business?"

Save as `template_type` in `template.config.json`.

Template type determines:
- which sections to build (see `agents/sections.md`)
- which output directory to use
- which initData files to update

## Step 0.2 — Output name

"What should we call this template variant? Use lowercase with dashes — for example `hotel-luxe` or `ecommerce-minimal`."

Save as `name` in `template.config.json`. Derive `slug` = name already lowercase-dashed.

The output directory will be the matching template folder:
- `ecommerce` → `ecommerce-template/`
- `tour` → `tour-template/`
- `hotel` → `hotel-template/`
- `business` → `business-template/`

## Step 0.3 — Clone

Run:
```bash
tsx scripts/clone.ts "<template_type>"
```

This copies `template-boilerplate` into the output directory. Skips if it already exists.

Confirm the output directory exists before continuing to Step 1.

## template.config.json

Write this after collecting answers:

```json
{
  "name": "<lowercase-dashed-name>",
  "template_type": "ecommerce | tour | hotel | business",
  "output_dir": "<ecommerce-template | tour-template | hotel-template | business-template>"
}
```
