class RemoteOnlyCover extends Cover {
    apply(currentPanel, element, targetPanel, generator) {
       // console.log('[REMOTE-COVER] apply called with element:', element);
        // Use ID-based matching for finding the element in this.elements
        const idx = currentPanel.elements.findIndex(e => e.split(/\s+/)[0] === element.id);
       // console.log('[REMOTE-COVER] Found element at index:', idx);
        if (idx !== -1 && ['c', 'r', 't'].includes(element.type)) {
           // console.log('[REMOTE-COVER] Element type matches, creating modified element');
            const tokens = element.elementString.split(/\s+/);
            const modified = new BuildElement(SHAPE_PREFIX_MAP[element.type]);
            modified.id = tokens[0];
            modified.gridWidth = element.gridWidth;
            modified.gridHeight = element.gridHeight;
            modified.x = element.x;
            modified.y = element.y;
            modified.color = tokens[4]; // Use index 4 to stay before any method/target tokens
            modified.elevation = element.elevation;
            modified.method = 'none'; // No direct interaction initially
            modified.title = `Remote-only ${element.id}`;
            modified.context = `Modified ${element.id} to be remote-only`;

            // Only apply modification if controllers are successfully added
            if (targetPanel && targetPanel.addRemoteControllers(modified)) {
               // console.log('[REMOTE-COVER] Controllers added successfully');
                currentPanel.elements[idx] = modified.toString();
                return true;
            } else {
               // console.log('[REMOTE-COVER] Failed to add controllers, targetPanel:', !!targetPanel);
            }
        } else {
           // console.log('[REMOTE-COVER] Condition failed - idx:', idx, 'type:', element.type, 'type matches:', ['c', 'r', 't'].includes(element.type));
        }
        return false;
    }
}
