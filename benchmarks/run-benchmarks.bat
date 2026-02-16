@echo off
REM ============================================================
REM  QURACUS Benchmark Runner (Windows)
REM  Runs REST waterfall and GraphQL aggregated load tests
REM ============================================================

set SCRIPT_DIR=%~dp0
set RESULTS_DIR=%SCRIPT_DIR%results

echo ============================================
echo  QURACUS Performance Benchmark Suite
echo ============================================
echo.

REM Check k6 is installed
where k6 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo k6 is not installed. Install it:
    echo   winget install grafana.k6
    echo   or download from https://k6.io/docs/get-started/installation/
    exit /b 1
)

if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

set MODE=%1
if "%MODE%"=="" set MODE=all

if "%MODE%"=="rest" goto :rest
if "%MODE%"=="graphql" goto :graphql
if "%MODE%"=="comparison" goto :comparison
if "%MODE%"=="cache" goto :cache
if "%MODE%"=="quick" goto :quick
if "%MODE%"=="all" goto :all
goto :usage

:rest
echo Running REST Waterfall benchmark...
k6 run "%SCRIPT_DIR%rest-waterfall.js"
goto :done

:graphql
echo Running GraphQL Aggregated benchmark...
k6 run "%SCRIPT_DIR%graphql-aggregated.js"
goto :done

:comparison
echo Running side-by-side comparison...
k6 run "%SCRIPT_DIR%comparison.js"
goto :done

:cache
echo Running Redis Cache Impact benchmark...
k6 run "%SCRIPT_DIR%cache-impact.js"
goto :done

:quick
echo Running quick test (10 VUs, 10s each)...
echo --- REST Waterfall ---
k6 run --vus 10 --duration 10s "%SCRIPT_DIR%rest-waterfall.js"
echo.
echo --- GraphQL Aggregated ---
k6 run --vus 10 --duration 10s "%SCRIPT_DIR%graphql-aggregated.js"
goto :done

:all
echo Running full benchmark suite...
echo.
echo [1/4] REST Waterfall
k6 run "%SCRIPT_DIR%rest-waterfall.js"
echo.
echo [2/4] GraphQL Aggregated
k6 run "%SCRIPT_DIR%graphql-aggregated.js"
echo.
echo [3/4] Side-by-Side Comparison
k6 run "%SCRIPT_DIR%comparison.js"
echo.
echo [4/4] Redis Cache Impact
k6 run "%SCRIPT_DIR%cache-impact.js"
goto :done

:usage
echo Usage: run-benchmarks.bat [rest^|graphql^|comparison^|cache^|quick^|all]
echo.
echo   rest        - Run REST waterfall benchmark only
echo   graphql     - Run GraphQL aggregated benchmark only
echo   comparison  - Run side-by-side comparison
echo   cache       - Run Redis cache impact analysis
echo   quick       - Quick 10s smoke test for both
echo   all         - Run full suite (default)
exit /b 1

:done
echo.
echo Done! Check results in: %RESULTS_DIR%
