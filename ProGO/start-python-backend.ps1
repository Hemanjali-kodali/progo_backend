$ErrorActionPreference = 'Stop'

Write-Host 'Starting Flask ML service on http://127.0.0.1:5001 ...' -ForegroundColor Cyan
Start-Process -WindowStyle Hidden -FilePath "C:/Users/chani/AppData/Local/Programs/Python/Python312/python.exe" -ArgumentList "D:/ProGO/py-backend/flask_ml_service.py"

Start-Sleep -Seconds 1

Write-Host 'Starting FastAPI service on http://127.0.0.1:5000 ...' -ForegroundColor Cyan
Start-Process -WindowStyle Hidden -FilePath "C:/Users/chani/AppData/Local/Programs/Python/Python312/python.exe" -ArgumentList "-m uvicorn fastapi_app:app --app-dir D:/ProGO/py-backend --host 127.0.0.1 --port 5000"

Write-Host 'Python backend started: FastAPI(5000) + Flask ML(5001)' -ForegroundColor Green
