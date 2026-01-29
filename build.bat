@echo off
setlocal enabledelayedexpansion

:: Generate a 5‑digit random number
set /a ver=(%RANDOM% * 32768 + %RANDOM%) %% 90000 + 10000

echo Building index.html with version v=%ver%

(
  for /f "usebackq delims=" %%A in ("src/index.html") do (
    set "line=%%A"
    set "line=!line:@VER@=%ver%!"
    echo !line!
  )
) > index.html

echo Done.