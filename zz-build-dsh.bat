@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 goto :fail

rem Full repository build from CURRENT LOCAL sources, including uncommitted edits.
rem No Git requirement, no revision-based skip, no pull, and no app startup.
rem Double-click to run; use /no-pause when calling from another terminal/script.
rem Complete means the repository's default build scope, not a clean/cache purge.
rem External link-installed plugins have their own build commands.

if not exist "package.json" (
    echo [ERROR] Put this script in the deepseek-harness repository root.
    goto :fail
)
if not exist ".node-version" (
    echo [ERROR] Missing .node-version. The project Node version is required.
    goto :fail
)
if not exist "scripts\build.ts" (
    echo [ERROR] Missing scripts\build.ts. Check the local source checkout.
    goto :fail
)
rem No private temp directory is created: the default TEMP is used as-is, and
rem zz-esbuild-inline.cjs keeps esbuild from needing its own temp files.
rem Use the same project-scoped fnm environment as the existing launchers.
set "FNM=%LOCALAPPDATA%\Microsoft\WinGet\Links\fnm.exe"
if not exist "%FNM%" set "FNM=fnm"
"%FNM%" --version >nul 2>nul
if errorlevel 1 (
    echo [ERROR] fnm not found. Install with: winget install Schniz.fnm --source winget
    goto :fail
)
for /f "usebackq delims=" %%i in (`"%FNM%" env --shell cmd`) do call %%i
set "FNM_LOGLEVEL=error"
set "FNM_NODE_DIST_MIRROR=https://npmmirror.com/mirrors/node"
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"

echo [INFO] Close running DSH instances before building to avoid locked/mixed artifacts.
echo ==^> Preparing the Node version pinned in .node-version ...
"%FNM%" install
if errorlevel 1 goto :fail
"%FNM%" use >nul 2>nul
if errorlevel 1 goto :fail
for /f "usebackq delims=" %%i in (`"%FNM%" use 2^>nul`) do call %%i
node --version
if errorlevel 1 goto :fail
call pnpm --version
if errorlevel 1 goto :fail

echo.
echo ==^> Installing dependencies from the existing lockfile ...
call pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com --fetch-timeout=600000
if errorlevel 1 goto :fail

rem This host denies the delete of esbuild's >1 MiB transform temp files, which
rem stops the Web bundle. The shim sends those inputs inline instead; it only
rem rewrites esbuild's own loader and is not part of the repository.
set "NODE_OPTIONS=--require %~dp0zz-esbuild-inline.cjs"

echo.
echo ==^> Building ALL repository artifacts and aggregate checks ...
rem Default complete scope: native, Host, Client, Desktop, Web, and aggregate checks.
rem Do not replace this with build:artifacts, build:web, or a filtered plugin build.
call pnpm run build
if errorlevel 1 goto :fail

rem Do not report success if required Web/Desktop entry artifacts are missing.
for %%f in ("apps\cli\lib\bin.js" "apps\web\dist\index.html" "apps\desktop\lib\main.js" "apps\desktop-host\lib\index.js") do (
    if not exist "%%~f" (
        echo [ERROR] Build finished but a required artifact is missing: %%~f
        goto :fail
    )
)

echo.
echo [OK] Complete repository build finished. DSH was NOT started.
echo [INFO] Existing startup scripts and their build-stamp behavior are unchanged.
echo [INFO] Close running DSH instances before building to avoid locked/mixed artifacts.
if /i not "%~1"=="/no-pause" pause
exit /b 0

:fail
echo.
echo [ERROR] Build stopped. Fix the error above, then run this script again.
echo [INFO] A lockfile mismatch must be resolved explicitly; this script does not rewrite it.
if /i not "%~1"=="/no-pause" pause
exit /b 1
