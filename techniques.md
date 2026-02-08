# Mookon Box: Techniques and Covers

This document provides a summary of the puzzle techniques and covers currently implemented in the Mookon Box generator.

## Puzzle Techniques

Techniques are the core components of a puzzle panel. They define the primary interaction and the requirements that must be satisfied.

### [HoleTechnique](generator/HoleTechnique.js)
- **Concept**: Creates "holes" (sunken shapes) on the panel and corresponding "plugs" (draggable shapes) in the plug pool.
- **Interactions**:
    - **Draggable**: Plugs can be dragged into holes.
    - **Remote**: Plugs might have remote controllers (D-pads) if they aren't directly draggable.
- **Matching**: Can require strict color matching (`#`) or just shape/size matching (`=`).

### [ScrewTechnique](generator/ScrewTechnique.js)
- **Concept**: Places screws that must be rotated (unscrewed) to reveal what's underneath.
- **Interactions**:
    - **Hold & Rotate**: Requires the player to hold and spin the screw.
    - **Remote Sub-Puzzle**: Unscrewing often acts as a remote action to "move" something (revealing what's behind).
    - **Patterns**: Favors corner placements (4 corners, diag, or side).
    - **Secondary**: High chance (70%) of screws being grey. Some screws also hide hole-sockets.

### [SwitchTechnique](generator/SwitchTechnique.js)
- **Concept**: Adds sliding switches to the panel.
- **Interactions**:
    - **Tap**: Tapping cycles the switch state (position).
    - **Matching**: Switches have a target state that must be reached.
    - **Visuals**: Features a "pill" background with unsatisfied/satisfied colors and a sliding ball.

### [MazeTechnique](generator/MazeTechnique.js)
- **Concept**: Generates a grid-based maze with a ball and an exit.
- **Interactions**:
    - **Draggable Ball**: The player must drag a ball through the maze to the exit socket.
    - **Entrance/Exit**: Entrance is usually on the bottom edge; exit is the farthest internal cell.
- **Buffer**: Reserves a row below the maze to prevent other elements from blocking the entrance.

### [GroupTechnique](generator/GroupTechnique.js)
- **Concept**: Creates a grid/pattern of similar elements where only a few are functional.
- **Interactions**:
    - **Tap & Reveal**: Only specific "key" elements in the group can be interacted with (revealing a drag action).
    - **Patterns**: All-fill, Checkerboard, or Random patterns.
    - **Deception**: Most elements in the group do nothing (`method: 'none'`).

---

## Covers

Covers are modifiers added to existing elements on the same panel to obscure them or add complexity. While the targets (sockets/screws/switches) are fixed to their panel, any associated controllers are also created on that same panel. Only **plugs** possess the ability to move between panels.

### [PhysicalCover](generator/PhysicalCover.js)
- **Behavior**: Places a physical object (circle, rectangle, etc.) directly on top of the target element.
- **Removal**: The cover must be removed (dragged, tapped, unscrewed, or controlled remotely) to access the target.

### [GroupObscureCover](generator/GroupObscureCover.js)
- **Behavior**:
    - **For Switches**: Creates a specific cover plate over the switch.
    - **For Others**: Surrounds the target with several "distractor" elements of the same shape, making it harder to identify the interactive one.

### [RemoteOnlyCover](generator/RemoteOnlyCover.js)
- **Behavior**: Disables direct interaction with an element and forces it to be controlled via remote controllers (D-pads).

### [SwitchReleaseCover](generator/SwitchReleaseCover.js)
- **Behavior**: Locks an element so it cannot be interacted with until a specific switch (placed nearby) is toggled to the correct position.

### [SizeObscureCover](generator/SizeObscureCover.js)
- **Behavior**: Changes the size of an element so it doesn't match its requirement (e.g., a plug that is too small for its socket).
- **Interaction**: Adds a "Size Controller" (typically a button) that cycles the element's size until it matches the target.

---

## [CoverManager](generator/CoverManager.js)

The `CoverManager` orchestrates the application of covers during panel generation.
- **Probability**: Defaults to a 33% chance per element.
- **Stacking**: Can stack multiple covers on a single element (e.g., a screw cover that is also remote-only).
- **Difficulty Awareness**: Adjusts maximum covers and stack limits based on the `DIFFICULTY_CONFIG`.
