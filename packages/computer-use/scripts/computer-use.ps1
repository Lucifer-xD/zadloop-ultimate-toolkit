param(
  [Parameter(Mandatory = $true)][string]$RequestBase64,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$MaxWidth = 1920,
  [int]$MaxHeight = 1200
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class ZadLoopComputerNative
{
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }

    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT { public uint type; public InputUnion U; }

    [StructLayout(LayoutKind.Explicit)]
    public struct InputUnion
    {
        [FieldOffset(0)] public MOUSEINPUT mi;
        [FieldOffset(0)] public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public UIntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public UIntPtr dwExtraInfo;
    }

    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT point);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, int data, UIntPtr extraInfo);
    [DllImport("user32.dll", SetLastError = true)] public static extern uint SendInput(uint count, INPUT[] inputs, int size);

    public static void Key(ushort key, bool up)
    {
        INPUT input = new INPUT();
        input.type = 1;
        input.U.ki.wVk = key;
        input.U.ki.dwFlags = up ? 0x0002u : 0u;
        if (SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT))) != 1)
            throw new InvalidOperationException("Windows refused keyboard input.");
    }

    public static void Unicode(char character, bool up)
    {
        INPUT input = new INPUT();
        input.type = 1;
        input.U.ki.wScan = character;
        input.U.ki.dwFlags = 0x0004u | (up ? 0x0002u : 0u);
        if (SendInput(1, new INPUT[] { input }, Marshal.SizeOf(typeof(INPUT))) != 1)
            throw new InvalidOperationException("Windows refused Unicode input.");
    }
}
'@

[void][ZadLoopComputerNative]::SetProcessDPIAware()
$requestJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($RequestBase64))
$request = $requestJson | ConvertFrom-Json

function Get-Metrics {
  $desktop = [Windows.Forms.SystemInformation]::VirtualScreen
  $ratio = [Math]::Min(1.0, [Math]::Min($MaxWidth / [double]$desktop.Width, $MaxHeight / [double]$desktop.Height))
  $shotWidth = [Math]::Max(1, [int][Math]::Round($desktop.Width * $ratio))
  $shotHeight = [Math]::Max(1, [int][Math]::Round($desktop.Height * $ratio))
  [pscustomobject]@{
    OriginX = $desktop.Left
    OriginY = $desktop.Top
    DesktopWidth = $desktop.Width
    DesktopHeight = $desktop.Height
    ScreenshotWidth = $shotWidth
    ScreenshotHeight = $shotHeight
  }
}

function Convert-X([int]$x, $metrics) {
  $bounded = [Math]::Max(0, [Math]::Min($metrics.ScreenshotWidth - 1, $x))
  $metrics.OriginX + [int][Math]::Round($bounded * $metrics.DesktopWidth / [double]$metrics.ScreenshotWidth)
}

function Convert-Y([int]$y, $metrics) {
  $bounded = [Math]::Max(0, [Math]::Min($metrics.ScreenshotHeight - 1, $y))
  $metrics.OriginY + [int][Math]::Round($bounded * $metrics.DesktopHeight / [double]$metrics.ScreenshotHeight)
}

function Set-ScreenshotCursor([int]$x, [int]$y, $metrics) {
  if (-not [ZadLoopComputerNative]::SetCursorPos((Convert-X $x $metrics), (Convert-Y $y $metrics))) {
    throw 'Windows refused to move the cursor.'
  }
}

function Click-Mouse([uint32]$down, [uint32]$up) {
  [ZadLoopComputerNative]::mouse_event($down, 0, 0, 0, [UIntPtr]::Zero)
  Start-Sleep -Milliseconds 45
  [ZadLoopComputerNative]::mouse_event($up, 0, 0, 0, [UIntPtr]::Zero)
}

function Get-VirtualKey([string]$name) {
  $upper = $name.Trim().ToUpperInvariant()
  $named = @{
    'BACKSPACE' = 0x08; 'BS' = 0x08; 'TAB' = 0x09; 'ENTER' = 0x0D; 'RETURN' = 0x0D
    'SHIFT' = 0x10; 'CTRL' = 0x11; 'CONTROL' = 0x11; 'ALT' = 0x12; 'PAUSE' = 0x13
    'CAPSLOCK' = 0x14; 'ESC' = 0x1B; 'ESCAPE' = 0x1B; 'SPACE' = 0x20; 'PAGEUP' = 0x21
    'PAGEDOWN' = 0x22; 'END' = 0x23; 'HOME' = 0x24; 'LEFT' = 0x25; 'UP' = 0x26
    'RIGHT' = 0x27; 'DOWN' = 0x28; 'PRINTSCREEN' = 0x2C; 'INSERT' = 0x2D; 'DELETE' = 0x2E
    'WIN' = 0x5B; 'WINDOWS' = 0x5B; 'MENU' = 0x5D; 'NUMLOCK' = 0x90; 'SCROLLLOCK' = 0x91
  }
  if ($named.ContainsKey($upper)) { return [uint16]$named[$upper] }
  if ($upper -match '^F([1-9]|1[0-2])$') { return [uint16](0x6F + [int]$Matches[1]) }
  if ($upper.Length -eq 1 -and $upper -match '^[A-Z0-9]$') { return [uint16][char]$upper }
  throw "Unsupported key name: $name"
}

function Send-KeyChord([string]$chord) {
  $parts = @($chord.Split('+') | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })
  if ($parts.Count -eq 0) { throw 'The key chord is empty.' }
  $keys = @($parts | ForEach-Object { Get-VirtualKey $_ })
  foreach ($key in $keys) { [ZadLoopComputerNative]::Key($key, $false) }
  Start-Sleep -Milliseconds 35
  for ($index = $keys.Count - 1; $index -ge 0; $index--) { [ZadLoopComputerNative]::Key($keys[$index], $true) }
}

function Send-Text([string]$text) {
  foreach ($character in $text.ToCharArray()) {
    [ZadLoopComputerNative]::Unicode($character, $false)
    [ZadLoopComputerNative]::Unicode($character, $true)
  }
}

function Convert-Wheel([int]$amount) {
  if ($amount -eq 0) { return 0 }
  $notches = [Math]::Max(1, [Math]::Ceiling([Math]::Abs($amount) / 100.0))
  [int]([Math]::Sign($amount) * $notches * 120)
}

function Save-Screenshot($metrics) {
  $source = New-Object Drawing.Bitmap $metrics.DesktopWidth, $metrics.DesktopHeight, ([Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $graphics = [Drawing.Graphics]::FromImage($source)
  try {
    $graphics.CopyFromScreen($metrics.OriginX, $metrics.OriginY, 0, 0, $source.Size, [Drawing.CopyPixelOperation]::SourceCopy)
  } finally {
    $graphics.Dispose()
  }

  try {
    if ($metrics.ScreenshotWidth -eq $metrics.DesktopWidth -and $metrics.ScreenshotHeight -eq $metrics.DesktopHeight) {
      $source.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
      return
    }
    $target = New-Object Drawing.Bitmap $metrics.ScreenshotWidth, $metrics.ScreenshotHeight, ([Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $resize = [Drawing.Graphics]::FromImage($target)
    try {
      $resize.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
      $resize.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
      $resize.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $resize.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $resize.DrawImage($source, 0, 0, $target.Width, $target.Height)
      $target.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $resize.Dispose()
      $target.Dispose()
    }
  } finally {
    $source.Dispose()
  }
}

$metrics = Get-Metrics
switch ($request.action) {
  'screenshot' { }
  'cursor' { }
  'move' { Set-ScreenshotCursor $request.x $request.y $metrics }
  'click' {
    Set-ScreenshotCursor $request.x $request.y $metrics
    Click-Mouse 0x0002 0x0004
  }
  'double_click' {
    Set-ScreenshotCursor $request.x $request.y $metrics
    Click-Mouse 0x0002 0x0004
    Start-Sleep -Milliseconds 90
    Click-Mouse 0x0002 0x0004
  }
  'right_click' {
    Set-ScreenshotCursor $request.x $request.y $metrics
    Click-Mouse 0x0008 0x0010
  }
  'drag' {
    $startX = Convert-X $request.x $metrics
    $startY = Convert-Y $request.y $metrics
    $endX = Convert-X $request.x2 $metrics
    $endY = Convert-Y $request.y2 $metrics
    $duration = if ($null -ne $request.PSObject.Properties['durationMs']) { [int]$request.durationMs } else { 600 }
    [void][ZadLoopComputerNative]::SetCursorPos($startX, $startY)
    [ZadLoopComputerNative]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
    try {
      $steps = [Math]::Max(4, [Math]::Min(120, [int][Math]::Ceiling($duration / 20.0)))
      for ($step = 1; $step -le $steps; $step++) {
        $progress = $step / [double]$steps
        [void][ZadLoopComputerNative]::SetCursorPos(
          [int][Math]::Round($startX + (($endX - $startX) * $progress)),
          [int][Math]::Round($startY + (($endY - $startY) * $progress))
        )
        Start-Sleep -Milliseconds ([Math]::Max(1, [int]($duration / $steps)))
      }
    } finally {
      [ZadLoopComputerNative]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
    }
  }
  'scroll' {
    if ($null -ne $request.PSObject.Properties['x']) { Set-ScreenshotCursor $request.x $request.y $metrics }
    $vertical = Convert-Wheel ([int]$request.deltaY)
    $horizontal = Convert-Wheel ([int]$request.deltaX)
    if ($vertical -ne 0) { [ZadLoopComputerNative]::mouse_event(0x0800, 0, 0, $vertical, [UIntPtr]::Zero) }
    if ($horizontal -ne 0) { [ZadLoopComputerNative]::mouse_event(0x1000, 0, 0, $horizontal, [UIntPtr]::Zero) }
  }
  'type' { Send-Text ([string]$request.text) }
  'keypress' { Send-KeyChord ([string]$request.keys) }
  'wait' { Start-Sleep -Milliseconds ([int]$request.durationMs) }
  default { throw "Unsupported action: $($request.action)" }
}

if ($request.action -notin @('screenshot', 'cursor', 'wait')) {
  $settle = if ($null -ne $request.PSObject.Properties['settleMs']) { [int]$request.settleMs } else { 250 }
  if ($settle -gt 0) { Start-Sleep -Milliseconds $settle }
}

$metrics = Get-Metrics
Save-Screenshot $metrics
$point = New-Object ZadLoopComputerNative+POINT
[void][ZadLoopComputerNative]::GetCursorPos([ref]$point)
$cursorX = [int][Math]::Round(($point.X - $metrics.OriginX) * $metrics.ScreenshotWidth / [double]$metrics.DesktopWidth)
$cursorY = [int][Math]::Round(($point.Y - $metrics.OriginY) * $metrics.ScreenshotHeight / [double]$metrics.DesktopHeight)

[pscustomobject]@{
  screen = [ordered]@{
    originX = $metrics.OriginX
    originY = $metrics.OriginY
    desktopWidth = $metrics.DesktopWidth
    desktopHeight = $metrics.DesktopHeight
    screenshotWidth = $metrics.ScreenshotWidth
    screenshotHeight = $metrics.ScreenshotHeight
    scaleX = $metrics.DesktopWidth / [double]$metrics.ScreenshotWidth
    scaleY = $metrics.DesktopHeight / [double]$metrics.ScreenshotHeight
  }
  cursor = [ordered]@{
    x = [Math]::Max(0, [Math]::Min($metrics.ScreenshotWidth - 1, $cursorX))
    y = [Math]::Max(0, [Math]::Min($metrics.ScreenshotHeight - 1, $cursorY))
  }
} | ConvertTo-Json -Depth 4 -Compress
