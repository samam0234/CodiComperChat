@echo off
rem CodiPhotonet image engine: start Stable Diffusion WebUI (AUTOMATIC1111) in API-only mode.
rem - Local only (127.0.0.1, no --listen). No browser UI (--nowebui); services/ai calls the API.
rem - --medvram-sdxl: the 12GB GPU is shared with Ollama.
rem - Does not touch webui-user.bat. Set SD_WEBUI_DIR if WebUI is installed elsewhere.
rem Models (models\Stable-diffusion): animagine-xl-4.0-opt.safetensors, v1-5-pruned-emaonly.safetensors
rem See docs/guidance/photonet-engine.md

if "%SD_WEBUI_DIR%"=="" set "SD_WEBUI_DIR=D:\SD\stable-diffusion-webui"
if not exist "%SD_WEBUI_DIR%\webui.bat" (
  echo Stable Diffusion WebUI not found: %SD_WEBUI_DIR%
  echo Set SD_WEBUI_DIR to the WebUI install folder.
  exit /b 1
)

rem Some shells set NoDefaultCurrentDirectoryInExePath, which stops cmd from finding webui.bat and its helpers
rem in the current folder. Clear it for this process only.
set "NoDefaultCurrentDirectoryInExePath="
cd /d "%SD_WEBUI_DIR%"
rem --server-name 127.0.0.1: without it the API-only server binds 0.0.0.0 (reachable from the LAN).
rem --ckpt: load the anime model at startup instead of whatever was used last.
rem No outer quotes here: the --ckpt path keeps its own quotes (WebUI splits COMMANDLINE_ARGS like a shell).
set COMMANDLINE_ARGS=--api --nowebui --server-name 127.0.0.1 --port 7860 --medvram-sdxl --skip-version-check --ckpt "%SD_WEBUI_DIR%\models\Stable-diffusion\animagine-xl-4.0-opt.safetensors"
call "%SD_WEBUI_DIR%\webui.bat"
