// Encode/decode functions with separate message and puzzle encoding
const PUZZLE_CHARSET = 'ctswr0123456789abdefghiABCDEFGHI .,:/-><=jkmnopuvxyz';
const MESSAGE_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ !.0123456789+-,';
const MESSAGE_DELIMITER = '|';
const ROT_STEP = 9;
const WORD_MAP = {
    'tap': 'a', 'drag': 'b', 'hold': 'd', 'color': 'e', 'state': 'f', 'rotation': 'g', 'none': 'h', 'move': 'i'
};

function encodePuzzle(puzzleString) {
    const parts = puzzleString.split('/');
    const message = parts[0].trim();
    const puzzleData = parts.slice(1).join('/');

    // Encode message with full charset
    const encodedMessage = message.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index + ROT_STEP) % MESSAGE_CHARSET.length];
    }).join('');

    // Encode puzzle data with compact charset
    let compressedPuzzle = puzzleData.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');

    Object.entries(WORD_MAP).forEach(([word, symbol]) => {
        compressedPuzzle = compressedPuzzle.replace(new RegExp(word, 'g'), symbol);
    });

    const encodedPuzzle = compressedPuzzle.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index + ROT_STEP) % PUZZLE_CHARSET.length];
    }).join('');

    const combined = encodedMessage + MESSAGE_DELIMITER + encodedPuzzle;
    return LZString.compressToEncodedURIComponent(combined);
}

function decodePuzzle(encodedString) {
    const decompressed = LZString.decompressFromEncodedURIComponent(encodedString);
    const [encodedMessage, encodedPuzzleData] = decompressed.split(MESSAGE_DELIMITER);

    // Decode message (no word decompression)
    const message = encodedMessage.split('').map(char => {
        const index = MESSAGE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return MESSAGE_CHARSET[(index - ROT_STEP + MESSAGE_CHARSET.length) % MESSAGE_CHARSET.length];
    }).join('');

    // Decode puzzle data
    let puzzleData = encodedPuzzleData.split('').map(char => {
        const index = PUZZLE_CHARSET.indexOf(char);
        if (index === -1) return char;
        return PUZZLE_CHARSET[(index - ROT_STEP + PUZZLE_CHARSET.length) % PUZZLE_CHARSET.length];
    }).join('');

    // Decompress words ONLY in puzzle data (not message)
    puzzleData = puzzleData.replace(/\bg\b/g, 'rotation');
    puzzleData = puzzleData.replace(/\be\b/g, 'color');
    puzzleData = puzzleData.replace(/\bf\b/g, 'state');
    puzzleData = puzzleData.replace(/\bd\b/g, 'hold');
    puzzleData = puzzleData.replace(/\bb\b/g, 'drag');
    puzzleData = puzzleData.replace(/\ba\b/g, 'tap');
    puzzleData = puzzleData.replace(/\bh\b/g, 'none');
    puzzleData = puzzleData.replace(/\bi\b/g, 'move');

    return message + '/' + puzzleData;
}
