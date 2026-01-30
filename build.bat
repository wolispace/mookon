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

set ALLFILES=_js_files.js
echo. > %ALLFILES%

echo src
for %%f in (src\*.js) do (
    type "%%f" >> %ALLFILES%

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

echo Done.