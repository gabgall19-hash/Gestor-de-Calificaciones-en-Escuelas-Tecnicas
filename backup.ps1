# Script de Respaldo Local para Google Drive (Disco G:)

$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$zipName = "Respaldo_Colegio_$timestamp.zip"
$destinationPath = "G:\Mi unidad\Escuela"
$tempZip = ".\$zipName"

# Verificar si la carpeta destino existe, si no, crearla
if (!(Test-Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath -Force
}

Write-Host "Iniciando respaldo en: $zipName..." -ForegroundColor Cyan

# Comprimir excluyendo node_modules, .git, etc.
# Usamos un filtro para excluir
Get-ChildItem -Path . -Exclude "node_modules", ".git", ".wrangler", "dist", ".gemini", "voice-project-*.json" | 
    Compress-Archive -DestinationPath $tempZip -Force

Write-Host "Copiando a Google Drive ($destinationPath)..." -ForegroundColor Yellow

# Mover el ZIP a Google Drive
Move-Item -Path $tempZip -Destination "$destinationPath\$zipName" -Force

Write-Host "¡Respaldo completado con éxito!" -ForegroundColor Green
Write-Host "Archivo guardado en: $destinationPath\$zipName"
