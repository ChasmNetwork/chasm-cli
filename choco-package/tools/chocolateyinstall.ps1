$ErrorActionPreference = 'Stop'

$packageName = 'chasm'
$url = 'https://github.com/ChasmNetwork/chasm-cli/releases/download/v0.0.1/chasm-cli-windows-x64-v0.0.1.tar.gz'

$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$zipPath = Join-Path $toolsDir "$packageName.zip"
$binPath = Join-Path $toolsDir "chasm.exe"

Invoke-WebRequest -Uri $url -OutFile $zipPath

tar -xzf $zipPath -C $toolsDir

Rename-Item -Path (Join-Path $toolsDir "cli-windows-x64") -NewName $binPath
Remove-Item -Path $zipPath -Force

Install-ChocolateyShortcut -shortcutFilePath "$env:ChocolateyBinRoot\chasm.lnk" -targetPath $binPath
Install-ChocolateyPath -pathToInstall $toolsDir -pathType Machine
