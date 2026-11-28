$dossier = "C:\Users\Nolhanbj\Documents\perso\site wixe"
$watcher = New-Object System.IO.FileSystemWatcher $dossier
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = 'LastWrite, FileName, DirectoryName'
$watcher.EnableRaisingEvents = $true

$global:dernierChangement = $null
$action = {
    if ($Event.SourceEventArgs.FullPath -notmatch '\\\.git(\\|$)') {
        $global:dernierChangement = Get-Date
    }
}
Register-ObjectEvent $watcher Changed -Action $action | Out-Null
Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

Set-Location $dossier
Write-Host "Surveillance active (Ctrl+C pour arreter)"
while ($true) {
    Start-Sleep 2
    if ($global:dernierChangement -and ((Get-Date) - $global:dernierChangement).TotalSeconds -ge 5) {
        $global:dernierChangement = $null
        git add -A
        git commit -m "Auto : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git pull --no-edit origin main
        git push origin main
    }
}
