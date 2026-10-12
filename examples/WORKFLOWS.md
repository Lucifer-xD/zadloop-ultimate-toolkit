# Workflow examples

## Let the agent operate a desktop application

1. Select a model that supports image input.
2. Open **Computer** in the bottom dock.
3. Choose a short arm duration and select **Arm computer control**.
4. Ask for the visible task in normal language, such as “Open Settings and enable Night light.”
5. Watch the agent inspect a screenshot before acting and inspect a fresh screenshot after each action.
6. Select **Pause now** when the task is complete.

Computer Use deliberately starts paused and does not persist its arm grant across a ZadLoop restart or plugin reload. Pause before entering credentials or approving consequential changes.

## Correct an answer while preserving its tool history

1. Hover the assistant message action row.
2. Select **Edit reply**.
3. Replace only the incorrect text and save.
4. Continue the conversation. The next model request sees the corrected reply while existing reasoning and tool calls remain attached.

Use **Edit reasoning** when the final answer is correct but the model-visible reasoning should be corrected separately.

## Undo and retry an exchange

1. Stop the active generation if the agent is still working.
2. Click **Undo** beside the exchange.
3. Confirm that the exchange disappears.
4. Enter a corrected prompt in the same session.

Undo shadows the exchange in context; it does not revert commands or file changes performed during that exchange.

## Switch the existing session mode

1. Open the target session.
2. Read the compact dock label: `Standard → Delegate` or `Delegate → Standard`.
3. Click once and wait for the success status.
4. Verify the mode badge in the session header.

The session ID, transcript, working directory, and settings stay attached to the same session.

## Move a chat from a PC to an RDP

On the source computer:

1. Open the session.
2. Choose **Transfer → Export complete chat**.
3. Move the ZIP to the RDP using your preferred secure channel.

On the destination:

1. Install ZadLoop Ultimate Toolkit.
2. Configure your model provider credentials separately.
3. Choose **Transfer → Choose transfer file**.
4. Select the ZIP and wait for the success summary.
5. Open the imported session from the sidebar.

If the same session ID already exists, import stops without overwriting anything.

## Pair dark and light themes

1. Open Theme Studio in dark mode and select a dark preset.
2. Tune accent, gradient, surface depth, typography, and density while watching the live example.
3. Switch ZadLoop to light mode.
4. Select a light-only preset and tune its independent values.

Theme Studio automatically filters presets by the active appearance mode.
