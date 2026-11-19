[CmdletBinding()]
param(
    [string]$RuntimeArchive
)

$ErrorActionPreference = 'Stop'
$app = Join-Path $PSScriptRoot 'Fableglass'
$build = Join-Path $app '.build'
$runtime = Join-Path $app 'runtime'
$model = Join-Path $app 'fableglass-q8.gguf'
$protocol = Join-Path $app 'protocol.json'
$runtimeUrl = 'https://github.com/ggml-org/llama.cpp/releases/download/b12128/llama-b12128-bin-win-cpu-x64.zip'
$runtimeHash = '2864BC950FE1681F1867EBC1BF0D6A66D18CC5561B29C285B4504787145BD7B7'
$modelHash = '4BB325F66E53E79790B70A5495A611CCE5DA3C67B581FCD261F732D3527632F0'

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Program exited with code $LASTEXITCODE."
    }
}

if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
    throw 'This setup script targets Windows x64.'
}
Get-Command node.exe -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Force -Path $build | Out-Null

$runtimeReady = (Test-Path -LiteralPath (Join-Path $runtime 'llama-server.exe')) -and
    (Test-Path -LiteralPath (Join-Path $runtime 'llama-quantize.exe')) -and
    (Test-Path -LiteralPath (Join-Path $runtime '.fableglass-runtime-b12128'))
if (-not $runtimeReady) {
    if (-not $RuntimeArchive) {
        $RuntimeArchive = Join-Path $build 'llama-b12128-bin-win-cpu-x64.zip'
        if (-not (Test-Path -LiteralPath $RuntimeArchive)) {
            Invoke-WebRequest -UseBasicParsing -Uri $runtimeUrl -OutFile $RuntimeArchive
        }
    }
    if ((Get-FileHash -LiteralPath $RuntimeArchive -Algorithm SHA256).Hash -ne $runtimeHash) {
        throw 'The runtime archive does not match the published Windows x64 CPU archive SHA-256.'
    }
    Expand-Archive -LiteralPath $RuntimeArchive -DestinationPath $runtime -Force
    if (-not (Test-Path -LiteralPath (Join-Path $runtime 'llama-server.exe')) -or
        -not (Test-Path -LiteralPath (Join-Path $runtime 'llama-quantize.exe'))) {
        throw 'The runtime did not extract its required executables.'
    }
    Set-Content -LiteralPath (Join-Path $runtime '.fableglass-runtime-b12128') -Value $runtimeHash
}

if (-not (Test-Path -LiteralPath $model) -or (Get-FileHash -LiteralPath $model -Algorithm SHA256).Hash -ne $modelHash) {
    $environment = Join-Path $PSScriptRoot '.venv'
    $python = Join-Path $environment 'Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $python)) {
        $systemPython = (Get-Command python.exe -ErrorAction Stop).Source
        Invoke-Checked $systemPython @('-m', 'venv', $environment)
    }
    Invoke-Checked $python @('-m', 'pip', 'install', '-r', (Join-Path $PSScriptRoot 'requirements.txt'))
    $f16 = Join-Path $build 'fableglass-f16.gguf'
    $q8 = Join-Path $build 'fableglass-q8.gguf'
    $manifest = Join-Path $build 'protocol.json'
    Invoke-Checked $python @((Join-Path $app 'compile_story.py'), '--model', $f16, '--protocol', $manifest)
    Invoke-Checked (Join-Path $runtime 'llama-quantize.exe') @($f16, $q8, 'Q8_0', '8')
    if ((Get-FileHash -LiteralPath $q8 -Algorithm SHA256).Hash -ne $modelHash) {
        throw 'The locally compiled checkpoint does not match the reference Q8_0 SHA-256.'
    }
    if (((Get-Content -Raw -LiteralPath $manifest -Encoding utf8) -replace '\r\n', [char]10) -cne
        ((Get-Content -Raw -LiteralPath $protocol -Encoding utf8) -replace '\r\n', [char]10)) {
        throw 'The generated token manifest does not match the source manifest.'
    }
    Move-Item -LiteralPath $q8 -Destination $model -Force
    Remove-Item -LiteralPath $f16
}

Write-Host 'Fableglass is ready. Double-click Play Fableglass.cmd, or run node .\Fableglass\server.mjs --no-open for headless use.'
