# Copilot Instructions

Stop making summary docs for each things you do.
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