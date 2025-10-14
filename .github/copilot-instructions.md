# Copilot Instructions

Stop making summary or extra docs for each things you do. Only make a doc when i explicity say so.

After every feature, only update in progress.md file.

When you make a doc, follow these rules:
## Windows PowerShell Environment
- ❌ Never use `&&` (not supported in Windows)
- ✅ Use semicolons `;` to chain commands
- Example: `cd backend; npm install; npm run dev`

## Documentation Rules
- ❌ Don't create documentation unless explicitly requested
- ❌ Don't create README files in subdirectories
- ✅ Keep existing docs minimal and focused

## Code Structure Rules
- ✅ Keep files modular 
- ✅ Split large files into smaller, focused modules
- ✅ Separate business logic from UI components
- ✅ Extract reusable utilities into separate files