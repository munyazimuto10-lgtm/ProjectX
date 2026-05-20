@echo off
REM Apply RLS migration to Supabase via SQL
REM 
REM Usage: apply-rls-migration.bat <SERVICE_ROLE_KEY>
REM 
REM Get your service role key from:
REM   https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api

if "%1"=="" (
    echo Error: SERVICE_ROLE_KEY not provided
    echo.
    echo Usage: apply-rls-migration.bat ^<SERVICE_ROLE_KEY^>
    echo.
    echo Get your service role key from:
    echo   https://app.supabase.com/project/lrytuvjouolizcgknqpd/settings/api
    exit /b 1
)

setlocal enabledelayedexpansion

set SUPABASE_URL=https://lrytuvjouolizcgknqpd.supabase.co
set SERVICE_ROLE_KEY=%1

REM Read the migration SQL file
for /f "delims=" %%i in (supabase\migrations\003_add_rls_policies.sql) do set "sql=!sql!%%i "

echo Applying RLS migration...
echo.

REM Execute the SQL against Supabase using curl
curl -X POST ^
  "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
  -H "Authorization: Bearer %SERVICE_ROLE_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"sql\": \"!sql!\"}"

if %ERRORLEVEL% equ 0 (
    echo.
    echo.
    echo Migration applied successfully!
) else (
    echo.
    echo.
    echo Error applying migration
    exit /b 1
)
