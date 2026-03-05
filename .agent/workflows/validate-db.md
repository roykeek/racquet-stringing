---
description: How to validate the database after schema or seed changes
---

# DB Validation Workflow

Run this after any change to the database (seed updates, migrations, manual edits).

// turbo-all

## Steps

1. Run the validation script:

```powershell
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/validate.ts
```

1. Review the output:
   - All 6 checks should show ✅
   - The "Models per Manufacturer" table should list the expected models
   - If any check shows ❌, investigate before proceeding

2. (Optional) Browser verification:
   - Open `http://localhost:3000/booking`
   - Select a manufacturer from the dropdown
   - Confirm models populate correctly in the model dropdown

## What the script checks

| # | Check | What it validates |
|---|-------|-------------------|
| 1 | Manufacturers exist | At least one manufacturer in DB |
| 2 | All manufacturers have models | No empty manufacturers |
| 3 | Models exist | At least one racquet model in DB |
| 4 | FK integrity | All models linked to valid manufacturer |
| 5 | No duplicates | No duplicate model names per manufacturer |
| 6 | Stringer exists | At least one stringer user |
