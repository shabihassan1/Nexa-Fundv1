# Copilot Instructions

## Windows PowerShell Environment
- ❌ Never use `&&` (not supported in Windows)
- ✅ Use semicolons `;` to chain commands
- Example: `cd backend; npm install; npm run dev`

## Documentation Rules
- ❌ Don't create documentation unless explicitly requested
- ❌ Don't create README files in subdirectories
- ✅ Keep existing docs minimal and focused

## Code Structure Rules
- ✅ Keep files modular and under 300 lines
- ✅ Split large files into smaller, focused modules
- ✅ Separate business logic from UI components
- ✅ Extract reusable utilities into separate files