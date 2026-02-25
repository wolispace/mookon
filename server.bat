@echo off
:: read in my local settings that sets vars like: set PHP_PATH="W:\My Drive\Apps\php7\php.exe"
call _env.bat

start "" http://localhost:88/dev.html

start "" %PHP_PATH% -S localhost:88
pause