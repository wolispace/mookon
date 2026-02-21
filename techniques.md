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
- **remote-id [reset]**: Resets the target element to its initial configuration (location, state, etc.). If the target is a plug in a socket, it will "pop out" to a nearby free space.
### [RemoteOnlyCover](generator/RemoteOnlyCover.js)
- **Behavior**: Disables direct interaction with an element and forces it to be controlled via remote controllers (D-pads).

### [SwitchReleaseCover](generator/SwitchReleaseCover.js)
- **Behavior**: Locks an element so it cannot be interacted with until a specific switch (placed nearby) is toggled to the correct position.

### [SizeObscureCover](generator/SizeObscureCover.js)
- **Behavior**: Changes the size of an element so it doesn't match its requirement (e.g., a plug that is too small for its socket).
- **Interaction**: Adds a "Size Controller" (typically a button) that cycles the element's size.

### [ResetCover](generator/ResetCover.js)
- **Behavior**: Places a standalone interactive element (like a switch or button) in a vacant space on the panel.
- **Effect**: Interacting with this "trap" resets a random target element on the same panel to its initial state. If the target is a plug in a socket, it will "pop out" to a nearby free space.

---

## [CoverManager](generator/CoverManager.js)

The `CoverManager` orchestrates the application of covers during panel generation.
- **Probability**: Defaults to a 33% chance per element.
- **Stacking**: Can stack multiple covers on a single element (e.g., a screw cover that is also remote-only).
- **Difficulty Awareness**: Adjusts maximum covers and stack limits based on the `DIFFICULTY_CONFIG`.

### tumbler and technique
This consists of a tumbler 't': 
- It's a circle in any color, styled as raised, 
- with a socket (wide rectangle in a dark grey and a sunken style) 
- positioned like a minute hand pointing to 6 oclock, and starting from just above centre (midway between 12 coclock and the centre).
- its always a perfect curcle and should always be size 2 
- the timbler can't be draged.

The key 'k' :
- is a rectangle of the same size as the dark rectangle on the tumbler
- its styled like the timbler: same color and raise
- the key can be dragged.

The mechanic: 
- The key is dropped on the tumbler 
- then the key is locked into possition like a plug dropped on a socket
- We dont need the '#' in config to enforce exact color match of key to tumbler

They key differences between socket and plug logic:
- the key should always remain styled as raised after being dropped on the tumbler
- the tumbler is not satisfied until the key/tumbler pair has been 'held' and 'rotated' by the number af degrees specified in config like a screw.
The tumbler can't be rorated unless it has the key locked in.

When unlocked the tumbler, the rotation should return back to the default position like a screw.

This is combining logic used for socket and plug with screw so share code where possible.

Config examples:
t1 1 1x1 0 2 hold rotate 2
k1 1 3x3 0 2 drag


## New ideas


### Semicircles technique
We need a new shape being a semicircle 

Defined in config as "q", "p", "u", "n" (or whatever letters are free)

Same in every way to a circle, just laf the width or eight based on the orientation.
 
The 4 rotations are 
"q" left half, 
"p" right half, 
"u" buttom half, 
"n" top half.

A circular socket can have a new matching state "q" or "u" 
- "q" means it must be filled with matching size (any color) "q" left and "p" right semicircle
- "u" means it must be filled with matching size (any color) "u" up and "n" down semicircle

The uppercase version of "C" and "U" are for exact size and color semicircle match.

When a semicricle is dropped on a suitable socket, it will snap to the cercumferance leaving room for the second in the pair to complete the match.

The socket circle needs to keep track of how many pieces are in it so it not just a simple matter of drop one piece in and the socket is satisfied.

This meanes every socket could have the potential of 1 or more plugs needed to satisfy them so they need to keep track of how many plugs are in them and compare that to their requirements:
= 1 plug
# 1 plug
c 2 plugs
u 2 plugs
C 2 plugs
U 2 plugs

In the future there may be sockets that require 3 or more plugs so lets plan the logic around that, but we only need 2 for now.

Config example:
c1 1 1x1- 0 0 c,
q1 1 3x3+ 0 2 tap drag,
p2 1 6x3+ 0 2 tap drag,


### Switch patterns technique (incomplete spec - don not implement yet)
A set of switches that must be moved to each switches target state then a master switch can to be switched to satisfy itself - only when all linked switcheds are in their target state.

This means two new switch types:
- a switch that cycles colours each step ensuring their target state is a specific color all switches in this set share. Then do not count towards panel completeness, only the master switch does.

- a master switch that is always size 1 target 1 and if all of the linked switches are in their target state the master switch stays in place and is staisfied. if not it resets back to state 0.

i1 3x1 1x1 0 x-2-5 tap state 2,
i2 2x1 1x2 0 3-2-2 tap state 2,

