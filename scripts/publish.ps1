param([switch]$SkipBrowserChecks)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $projectRoot

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE. Publishing stopped." }
}

$npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
$gitCommand = (Get-Command git -ErrorAction Stop).Source

Write-Host 'Installing dependencies and checking the site...'
Invoke-Checked -Command $npmCommand -Arguments @('install', '--no-audit', '--no-fund')
Invoke-Checked -Command $npmCommand -Arguments @('test')
Invoke-Checked -Command $npmCommand -Arguments @('run', 'build')
Invoke-Checked -Command $npmCommand -Arguments @('run', 'validate')
if (-not $SkipBrowserChecks) {
    Invoke-Checked -Command $npmCommand -Arguments @('exec', '--', 'playwright', 'install', 'chromium')
    Invoke-Checked -Command $npmCommand -Arguments @('run', 'test:e2e')
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.git'))) {
    Invoke-Checked -Command $gitCommand -Arguments @('init', '-b', 'main')
}
$branchName = & $gitCommand symbolic-ref --short HEAD
if ($branchName -ne 'main') { throw 'Switch to the main branch before publishing. No branch was changed.' }

$remoteUrl = & $gitCommand remote get-url origin
if ($LASTEXITCODE -ne 0) {
    Invoke-Checked -Command $gitCommand -Arguments @('remote', 'add', 'origin', 'https://github.com/afontana1/tech-guides-site.git')
} elseif ($remoteUrl -notin @('https://github.com/afontana1/tech-guides-site.git', 'https://github.com/afontana1/tech-guides-site', 'git@github.com:afontana1/tech-guides-site.git')) {
    throw "The origin remote points to a different repository: $remoteUrl. No remote was changed."
}

$authorName = & $gitCommand config --get user.name
if (-not $authorName) { Invoke-Checked -Command $gitCommand -Arguments @('config', '--local', 'user.name', 'afontana1') }
$authorEmail = & $gitCommand config --get user.email
if (-not $authorEmail) { throw 'Set your Git author email with git config user.email before publishing.' }

Invoke-Checked -Command $gitCommand -Arguments @('fetch', 'origin')
$localHead = & $gitCommand rev-parse --verify --quiet HEAD
$remoteHead = & $gitCommand rev-parse --verify --quiet refs/remotes/origin/main
if ($remoteHead) {
    if (-not $localHead) {
        # Adopt the existing remote history without changing the local working files.
        # This avoids an unrelated-history merge with the initial README commit.
        Invoke-Checked -Command $gitCommand -Arguments @('reset', '--mixed', 'origin/main')
        $remoteFiles = & $gitCommand -c core.quotepath=false ls-tree -r --name-only origin/main
        foreach ($remoteFile in $remoteFiles) {
            $resolvedFile = [IO.Path]::GetFullPath((Join-Path $projectRoot $remoteFile))
            if (-not $resolvedFile.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                throw 'A remote path is outside this project. Publishing stopped.'
            }
            if (-not (Test-Path -LiteralPath $resolvedFile)) {
                Invoke-Checked -Command $gitCommand -Arguments @('restore', '--source=origin/main', '--worktree', '--', $remoteFile)
            }
        }
    } else {
        # Stop on divergent history instead of overwriting any remote commits.
        Invoke-Checked -Command $gitCommand -Arguments @('merge', '--ff-only', 'origin/main')
    }
}

Invoke-Checked -Command $gitCommand -Arguments @('add', '.')
& $gitCommand diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
    Invoke-Checked -Command $gitCommand -Arguments @('commit', '-m', 'Build searchable Tech Guides learning library')
} elseif ($LASTEXITCODE -ne 0) { throw 'Unable to check staged changes.' }

Invoke-Checked -Command $gitCommand -Arguments @('push', '-u', 'origin', 'main')
Write-Host ''
Write-Host 'Source pushed successfully. GitHub Actions will build and deploy the site.'
Write-Host 'One-time Pages setting: choose GitHub Actions as the publishing source:'
Write-Host 'https://github.com/afontana1/tech-guides-site/settings/pages'
Write-Host 'Workflow status: https://github.com/afontana1/tech-guides-site/actions'
Write-Host 'Site after successful deployment: https://afontana1.github.io/tech-guides-site/'
