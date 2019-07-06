@echo off
pushd %~dp0
cd _tailwind
call npx tailwind build base.css -o ../assets/css/output.css
call npx tailwind build blogs.css -o ../assets/css/blogs-output.css
popd
