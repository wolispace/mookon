@echo off
setlocal enabledelayedexpansion

set DEPLOY=_deploy

:: Generate a 5‑digit random number
set /a ver=(%RANDOM% * 32768 + %RANDOM%) %% 90000 + 10000

echo Building %DEPLOY%/index.html with version v=%ver%

(
  for /f "usebackq delims=" %%A in ("src/index.html") do (
    set "line=%%A"
    set "line=!line:@VER@=%ver%!"
    echo !line!
  )
) > %DEPLOY%/index.html

set ALLFILES=_js_files.js
echo. > %ALLFILES%

echo src
for %%f in (src\*.js) do (
    type "%%f" >> %ALLFILES%
   timeout /t 1 /nobreak >nul
)

echo generators
for %%f in (src\generator\*.js) do (
    type "%%f" >> %ALLFILES%

)

echo utils
for %%f in (src\utils\*.js) do (
    type "%%f" >> %ALLFILES%

)

echo core
for %%f in (src\core\*.js) do (
    type "%%f" >> %ALLFILES%

)

terser %ALLFILES% --output _js_files.min.js --compressed

type app010.css > %DEPLOY%/app010.css
type server.php > %DEPLOY%/server.php
type _js_files.min.js > %DEPLOY%/_js_files.min.js

echo Done.
pause