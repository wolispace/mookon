// Configuration Parser
class PuzzleParser {
    static parse(puzzleString) {
        try {
            const sections = puzzleString.split('/').map(s => s.trim());
            let messageText = sections[0] || '';
            let reward = null;

            // Extract reward from square brackets if present
            const rewardMatch = messageText.match(/\[([^\]]+)\]/);
            if (rewardMatch) {
                reward = rewardMatch[1].trim();
                messageText = messageText.replace(/\[([^\]]+)\]/, '').trim();
            }

            const panels = sections.slice(1).filter(s => s);
            if (panels.length === 0) throw new Error("No panels defined.");
            return { message: messageText, reward, panels };
        } catch (error) {
            PuzzleParser.showError(error.message);
            throw error;
        }
    }

    static parsePanel(panelString) {
        const colonIndex = panelString.indexOf(':');
        if (colonIndex === -1) throw new Error(`Invalid panel: "${panelString}"`);

        const color = panelString.substring(0, colonIndex).trim();
        const elementSection = panelString.substring(colonIndex + 1).trim();
        const elements = elementSection.split(',').map(s => s.trim()).filter(s => s);

        return { color, elements };
    }

    static parseElement(elementString, panel) {
        const tokens = elementString.split(/\s+/).filter(t => t);
        const element = new UIElement(panel);
        PuzzleParser.parseFormat(tokens, element);
        return element;
    }

    static parseFormat(tokens, element) {
        // Strip title attribute from tokens if present
        const filteredTokens = tokens.filter(t => !t.startsWith('title='));
        const [id, sizeStr, locationStr, rotationStr, colorStr] = filteredTokens;

        // Set basic properties
        element.id = id;
        element.shape = SHAPE_PREFIX_MAP[id[0].toLowerCase()] || 'circle';

        // Parse size - check for WIDTHxHEIGHT format for all shapes
        if (sizeStr.includes('x')) {
            const sizeParts = sizeStr.split('x');
            if (sizeParts.length === 2) {
                element.rectWidth = parseFloat(sizeParts[0]);
                element.rectHeight = parseFloat(sizeParts[1]);
                element.size = Math.max(element.rectWidth, element.rectHeight);
            } else {
                element.size = parseFloat(sizeStr);
            }
        } else {
            element.size = parseFloat(sizeStr);
        }

        const [x, y, height] = PuzzleParser.parseLocation(locationStr);
        element.x = x;
        element.y = y;
        element.height = height;
        element.rotation = parseInt(rotationStr) || 0;
        element.initialRotation = element.rotation;

        // Handle dual/triple colors for switches
        let initialState, secondaryColorIndex = null, ballColorIndex = null;
        if (colorStr.includes('-')) {
            const colors = colorStr.split('-');
            initialState = parseInt(colors[0]) || 0;
            secondaryColorIndex = parseInt(colors[1]) || 0;
            ballColorIndex = colors[2] !== undefined ? parseInt(colors[2]) : null;
        } else {
            initialState = parseInt(colorStr) || 0;
        }
        element.color = initialState;
        element.secondaryColor = secondaryColorIndex;
        element.ballColor = ballColorIndex;

        // Set defaults
        element.method = METHOD_NONE;
        element.change = CHANGE_NONE;
        element.targetState = 0;
        element.finalRotation = null;
        element.remoteActions = [];

        // Process remaining tokens sequentially
        let i = 5;
        while (i < filteredTokens.length) {
            const token = filteredTokens[i];

            if (token === METHOD_DRAG) {
                element.method = METHOD_DRAG;
                element.draggable = true;
                i++;

                // Check for move requirement
                if (i < filteredTokens.length && filteredTokens[i] === CHANGE_MOVE) {
                    element.change = CHANGE_MOVE;
                    element.targetState = 1;
                    i++;
                }
                break;
            } else if (METHOD_PATTERN.test(token)) {
                element.method = token;
                i++;

                // Get change type
                if (i < filteredTokens.length && CHANGE_PATTERN.test(filteredTokens[i])) {
                    element.change = filteredTokens[i];
                    i++;
                }

                // Get target state
                if (i < filteredTokens.length && /^\d+$/.test(filteredTokens[i])) {
                    element.targetState = parseInt(filteredTokens[i]);
                    i++;
                }

                // Check for remote element ID
                if (i < filteredTokens.length && ELEMENT_ID_PATTERN.test(filteredTokens[i])) {
                    const remoteId = filteredTokens[i];
                    i++;

                    // Check for vector pattern (remote move)
                    const vectorMatch = filteredTokens[i].match(/^([+\-]?(:?\d+(?:\.\d+)?|\.\d+))x([+\-]?(:?\d+(?:\.\d+)?|\.\d+))$/);

                    if (vectorMatch) {
                        const vx = parseFloat(vectorMatch[1]);
                        const vy = parseFloat(vectorMatch[3]);
                        i++;

                        element.remoteActions.push({
                            id: remoteId,
                            type: 'move_step',
                            vector: { x: vx, y: vy }
                        });

                    } else if (i < filteredTokens.length && METHOD_PATTERN.test(filteredTokens[i])) {
                        const remoteMethod = filteredTokens[i];
                        i++;

                        // Get remote change type and target
                        let remoteChange = CHANGE_NONE;
                        let remoteTarget = 0;

                        if (i < filteredTokens.length && CHANGE_PATTERN.test(filteredTokens[i])) {
                            if (filteredTokens[i] === CHANGE_MOVE) {
                                remoteChange = CHANGE_MOVE;
                                remoteTarget = 1;
                                i++;
                            } else {
                                remoteChange = filteredTokens[i];
                                i++;

                                // Get target value for change type
                                if (i < filteredTokens.length && NUMERIC_PATTERN.test(filteredTokens[i])) {
                                    remoteTarget = parseInt(filteredTokens[i]);
                                    i++;
                                }
                            }
                        }

                        element.remoteActions.push({
                            id: remoteId,
                            type: 'configure',
                            method: remoteMethod,
                            change: remoteChange,
                            target: remoteTarget
                        });
                    }
                }

                if (i < filteredTokens.length) {
                    console.log(`Configuration Error Element ${element.id}: Unrecognized token '${filteredTokens[i]}'. Expected change type, target state, or remote action.`, "color:red;font-weight:bold;");
                }
                break;
            } else if (COMPARISON_PATTERN.test(token)) {
                element.sizeComparison = token;
                i++;
            } else {
                i++;
            }
        }

        // Apply logic after all tokens processed
        element.state = element.change === CHANGE_COLOR ? initialState : 0;
        element.maxState = element.shape === 'switch' ? element.size : 8;

        if (element.method === METHOD_DRAG) {
            element.draggable = true;
        }
    }

    static parseLocation(locStr) {
        const parts = locStr.split('x');
        if (parts.length !== 2) throw new Error(`Invalid location format: "${locStr}"`);

        const x = parseFloat(parts[0]);

        let yStr = parts[1];
        let height = 0;
        if (yStr.endsWith('+')) {
            height = 1;
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('-')) {
            height = -1;
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('^')) {
            height = 2; // Shorthand for "start flat, target raised"
            yStr = yStr.slice(0, -1);
        } else if (yStr.endsWith('_')) {
            height = -2; // Shorthand for "start flat, target sunken"
            yStr = yStr.slice(0, -1);
        }
        const y = parseFloat(yStr);

        return [x, y, height];
    }

    static showError(msg) {
        const area = document.getElementById('puzzle-area');
        if (area) area.innerHTML = `<div style="color:#ff6b6b;padding:20px;">Error: ${msg}</div>`;
    }
};
