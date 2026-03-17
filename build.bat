@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  markdown-editor Build Script
echo ========================================
echo.
echo [1/2] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed.
    goto :error
)

echo.
echo [2/2] Building Tauri Application...
echo Running: npx tauri build
call npx tauri build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Tauri build failed.
    goto :error
)

echo.
echo ========================================
echo  Build Complete!
echo  Check src-tauri\target\release\bundle
echo ========================================
goto :end

:error
echo.
echo [!] Build failed with errors.
pause
exit /b %ERRORLEVEL%

:end
pause
