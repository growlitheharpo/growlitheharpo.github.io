@echo off
echo "NOTE: You must have node and npm on your path for all utilities to work!"
pushd %~dp0
cd _tailwind
call npm install tailwindcss
call npm install purgecss
call npm install clean-css
call npm install -g clean-css-cli
popd
