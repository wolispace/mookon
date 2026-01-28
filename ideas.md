# Plans.

## Puzzle generation

Some techniques involves two parts:
socket = the part to be satisfied
plug = the part that does the satisfying.

Id like to change the wording to 'completed' instead of 'satisfied' throughout the code.

Each technique should generate both socket and plug and place the socket on the panel.

The plug should be added to a list of plugs attached to the parent puzzle.

We then randomply pick zero, one or more plugs from the list and add them to the panel.

Then we randomply apply some obsuring to zero, one or more sockets and plugs.

We repeat this logic for subsequent panels, drawing on the current list of plugs we have generated for each socket.

The final panel will have to have all remaining plugs to make sure every socket can be completed.

Both plugs and sockets can be randomply obscured.

Obscuring takes the form of 'covers' which are larger elements placed over the element to be obscured that need to be 'completed' (like a screw needs unlocking or an element needs to be tapped to change colour to make it draggable)

Obsucring can also mean remote control movement. This would only apply to plugs as they have to be moved into a socket to complete it, but not by the user dragging but via remote control 'keys' like WASD left/right/up/down remoteAction=move. Which means 4 directional elements acting as 'tap' keys must be placed on the same panel as the plug.

Multiple obscuring can happen, eg a plug can be covered by a rectangle that cant be moved and then the plug is remote controlled by 4 elemets placed on the panel, so the player must move the hidden plug out from under the cover using the remote control 'keys'

## Future ideas

### Ideas for new elements and interactions

We should be able to change an elements shape! 


## Status
### Techniques
- Maze 
- Hole
- Screw
- Group
- Switch

## Rewards
A puzzle definition starts with a 'victory' message / as the first virtual panel.

Id like to add another element to the start of a puzzle config that is a 'reward' maybe formatted as 

Well cone! [pencil] /

When the victory panel is added to the screen the reward should be formatted as a font-awesome icon that can be clicked on.

When the player clicks on the this reward icon, it is moved over to the rewards area so a list of all rewards found are showin in the vertical column of rewards.

When each reward is clicked on it is also added to a list that is saved in local storage, so when the webpage is opened, all rewards strings eg "book", "pencil", "dice" are added to the rewards column.
