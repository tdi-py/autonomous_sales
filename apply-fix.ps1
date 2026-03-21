# ============================================================================
# apply-fix.ps1 — Run from the autonomous-sales root directory
# ============================================================================

Write-Host "=== Step 1: Clean stale build artifacts ===" -ForegroundColor Cyan

# Remove dist folders
if (Test-Path "apps/api/dist")    { Remove-Item -Recurse -Force "apps/api/dist"    }
if (Test-Path "apps/worker/dist") { Remove-Item -Recurse -Force "apps/worker/dist" }

# Remove stale .js files from src/ (these are compiled artifacts, not source)
Get-ChildItem -Path "apps/api/src"    -Filter "*.js" -Recurse | Remove-Item -Force
Get-ChildItem -Path "apps/worker/src" -Filter "*.js" -Recurse | Remove-Item -Force

Write-Host "  Cleaned dist/ and stale .js files" -ForegroundColor Green

# ============================================================================
Write-Host "`n=== Step 2: Update package.json files ===" -ForegroundColor Cyan

# --- packages/shared/package.json ---
$sharedPkg = @'
{
  "name": "@autonomous-sales/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "devDependencies": {
    "@types/node": "^20.19.37",
    "tsup": "^8.4.0",
    "typescript": "^5.4.5"
  },
  "type": "commonjs"
}
'@
Set-Content -Path "packages/shared/package.json" -Value $sharedPkg -Encoding UTF8
Write-Host "  Updated packages/shared/package.json" -ForegroundColor Green

# --- packages/database/package.json ---
$dbPkg = @'
{
  "name": "@autonomous-sales/database",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.4"
  },
  "devDependencies": {
    "@types/node": "^25.5.0",
    "dotenv": "^17.3.1",
    "drizzle-kit": "^0.22.0",
    "tsup": "^8.4.0",
    "typescript": "^5.4.5"
  },
  "type": "commonjs"
}
'@
Set-Content -Path "packages/database/package.json" -Value $dbPkg -Encoding UTF8
Write-Host "  Updated packages/database/package.json" -ForegroundColor Green

# ============================================================================
Write-Host "`n=== Step 3: Create tsup configs ===" -ForegroundColor Cyan

# --- packages/shared/tsup.config.ts ---
$sharedTsup = @'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
});
'@
Set-Content -Path "packages/shared/tsup.config.ts" -Value $sharedTsup -Encoding UTF8
Write-Host "  Created packages/shared/tsup.config.ts" -ForegroundColor Green

# --- packages/database/tsup.config.ts ---
$dbTsup = @'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: 'dist',
  external: ['drizzle-orm', 'postgres', 'drizzle-orm/postgres-js', 'drizzle-orm/pg-core'],
});
'@
Set-Content -Path "packages/database/tsup.config.ts" -Value $dbTsup -Encoding UTF8
Write-Host "  Created packages/database/tsup.config.ts" -ForegroundColor Green

# ============================================================================
Write-Host "`n=== Step 4: Update tsconfig.json files ===" -ForegroundColor Cyan

# --- apps/api/tsconfig.json ---
$apiTsconfig = @'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "noEmit": false,
    "strictNullChecks": true,
    "strict": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "strictPropertyInitialization": false,
    "paths": {
      "@autonomous-sales/database": ["../../packages/database/dist/index.d.ts"],
      "@autonomous-sales/shared": ["../../packages/shared/dist/index.d.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "../../node_modules"]
}
'@
Set-Content -Path "apps/api/tsconfig.json" -Value $apiTsconfig -Encoding UTF8
Write-Host "  Updated apps/api/tsconfig.json" -ForegroundColor Green

# --- apps/worker/tsconfig.json ---
$workerTsconfig = @'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "noEmit": false,
    "strictNullChecks": true,
    "strict": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "strictPropertyInitialization": false,
    "paths": {
      "@autonomous-sales/database": ["../../packages/database/dist/index.d.ts"],
      "@autonomous-sales/shared": ["../../packages/shared/dist/index.d.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "../../node_modules"]
}
'@
Set-Content -Path "apps/worker/tsconfig.json" -Value $workerTsconfig -Encoding UTF8
Write-Host "  Updated apps/worker/tsconfig.json" -ForegroundColor Green

# ============================================================================
Write-Host "`n=== Step 5: Update turbo.json ===" -ForegroundColor Cyan

$turboJson = @'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
'@
Set-Content -Path "turbo.json" -Value $turboJson -Encoding UTF8
Write-Host "  Updated turbo.json" -ForegroundColor Green

# ============================================================================
Write-Host "`n=== Step 6: Update .gitignore ===" -ForegroundColor Cyan

$gitignoreAddition = @'

# Package build outputs
packages/shared/dist/
packages/database/dist/
'@

$currentGitignore = ""
if (Test-Path ".gitignore") {
    $currentGitignore = Get-Content ".gitignore" -Raw
}
if ($currentGitignore -notmatch "packages/shared/dist") {
    Add-Content -Path ".gitignore" -Value $gitignoreAddition
    Write-Host "  Added dist/ entries to .gitignore" -ForegroundColor Green
} else {
    Write-Host "  .gitignore already has dist/ entries" -ForegroundColor Yellow
}

# ============================================================================
Write-Host "`n=== Step 7: Install tsup and rebuild ===" -ForegroundColor Cyan
Write-Host "  Run these commands manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  pnpm install" -ForegroundColor White
Write-Host "  pnpm --filter @autonomous-sales/shared build" -ForegroundColor White
Write-Host "  pnpm --filter @autonomous-sales/database build" -ForegroundColor White
Write-Host "  pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green