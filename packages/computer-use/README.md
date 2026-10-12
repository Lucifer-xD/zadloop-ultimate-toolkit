# ZadLoop Computer Use

Windows desktop control for ZadLoop agents. The model receives a fresh screenshot after every action and can use screenshot-relative coordinates to operate visible applications.

## Actions

- Screenshot and cursor inspection
- Move, click, double-click, and right-click
- Drag with adjustable duration
- Vertical and horizontal scrolling
- Unicode text entry
- Keyboard shortcuts such as `CTRL+L`, `ALT+TAB`, and `WIN+R`
- Wait for applications and animations to settle

## Safety

Computer control starts paused, and the agent can enable, inspect, or pause it through the `computer_access` tool whenever a requested task needs the visible desktop. The **Computer** panel remains available for manual status and control, grants expire automatically, and **Pause now** terminates in-flight automation. The package exposes only fixed mouse, keyboard, screenshot, and wait operations—never an arbitrary shell command.

Use a vision-capable model. Keep sensitive applications closed, supervise consequential work, and pause control before entering passwords or payment information.

## Development

```powershell
npm test
npm pack
```
