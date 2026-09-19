[CmdletBinding()]
param(
    [string]$Inject = "",
    [switch]$Clean,
    [switch]$PullRemote,
    [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"
$ResolvedItem = Get-Item $ProjectPath
$ResolvedProject = $ResolvedItem.FullName
$SkillsTarget = Join-Path $ResolvedProject ".skills"
$RemoteRepo = "https://github.com/ARUN-M-BE/skills-library.git"

$LocalLibrary = "C:\Users\Administrator\Downloads\TIT\AGENTS\skills-library"
if (-not (Test-Path $LocalLibrary)) {
    $LocalLibrary = Join-Path $HOME "ai-workspace\skills-library"
}

if ($PullRemote) {
    Write-Host "Fetching latest remote skills from $RemoteRepo..." -ForegroundColor Cyan
    if (Test-Path $LocalLibrary) {
        git -C $LocalLibrary pull origin main
    } else {
        git clone --depth 1 $RemoteRepo $LocalLibrary
    }
    Write-Host "Skills library synchronized successfully." -ForegroundColor Green
}

if ($Clean) {
    Write-Host "Cleaning ephemeral skill files from: $ResolvedProject..." -ForegroundColor Yellow
    
    if (Test-Path $SkillsTarget) {
        Remove-Item -Recurse -Force $SkillsTarget -ErrorAction SilentlyContinue
        Write-Host "  Removed .skills directory" -ForegroundColor Gray
    }

    $TempAgents = Join-Path $ResolvedProject "AGENTS.md"
    if (Test-Path $TempAgents) {
        $Content = Get-Content $TempAgents -Raw -ErrorAction SilentlyContinue
        if ($Content -and $Content.Contains("EPHEMERAL_SKILL_INJECTED")) {
            Remove-Item -Force $TempAgents -ErrorAction SilentlyContinue
            Write-Host "  Removed ephemeral AGENTS.md file" -ForegroundColor Gray
        }
    }

    Write-Host "Ephemeral skill cleanup complete. Project directory is clean." -ForegroundColor Green
    exit 0
}

if ($Inject -ne "") {
    Write-Host "Injecting ephemeral skill $Inject into $ResolvedProject..." -ForegroundColor Cyan
    
    $SkillMatches = Get-ChildItem -Path $LocalLibrary -Recurse -Filter "SKILL.md" -ErrorAction SilentlyContinue |
        Where-Object { $_.Directory.Name -eq $Inject -or $_.Directory.Parent.Name -eq $Inject }

    if (-not $SkillMatches) {
        Write-Host "Skill or Agent $Inject not found in library." -ForegroundColor Red
        Write-Host "Available items:" -ForegroundColor Yellow
        Get-ChildItem -Path $LocalLibrary -Recurse -Filter "SKILL.md" | ForEach-Object { Write-Host " - $($_.Directory.Name)" }
        exit 1
    }

    $FoundSkill = $SkillMatches[0]
    $SkillSourceDir = $FoundSkill.DirectoryName
    $DestinationDir = Join-Path $SkillsTarget $Inject

    New-Item -ItemType Directory -Force -Path $DestinationDir | Out-Null
    Copy-Item -Recurse -Force "$SkillSourceDir\*" "$DestinationDir\"

    $AgentsFile = Join-Path $ResolvedProject "AGENTS.md"
    $Marker = "<!-- EPHEMERAL_SKILL_INJECTED -->"
    
    if (-not (Test-Path $AgentsFile)) {
        Set-Content -Path $AgentsFile -Value "$Marker`n# Ephemeral Skill Context`nActive Agent or Skill: $Inject`n`n"
    } else {
        Add-Content -Path $AgentsFile -Value "`n`n$Marker`n<!-- Injected: $Inject -->"
    }

    Write-Host "Skill $Inject injected into .skills/$Inject successfully." -ForegroundColor Green
    Write-Host "Run powershell .\use-skill.ps1 -Clean when done to strip skill files." -ForegroundColor Cyan
}
