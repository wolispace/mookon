// SVG Factory Class
class SVGFactory {
    static init() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(svgNS, 'defs');

        // Shared sunken filter (inset shadow)
        const filter = document.createElementNS(svgNS, 'filter');
        filter.id = 'sunken-filter';
        filter.setAttribute('x', '-20%');
        filter.setAttribute('y', '-20%');
        filter.setAttribute('width', '140%');
        filter.setAttribute('height', '140%');

        const blur = document.createElementNS(svgNS, 'feGaussianBlur');
        blur.setAttribute('in', 'SourceAlpha');
        blur.setAttribute('stdDeviation', '2');
        blur.setAttribute('result', 'blur');

        const offset = document.createElementNS(svgNS, 'feOffset');
        offset.setAttribute('in', 'blur');
        offset.setAttribute('dx', '4');
        offset.setAttribute('dy', '4');
        offset.setAttribute('result', 'offsetBlur');

        const composite = document.createElementNS(svgNS, 'feComposite');
        composite.setAttribute('operator', 'out');
        composite.setAttribute('in', 'SourceGraphic');
        composite.setAttribute('in2', 'offsetBlur');
        composite.setAttribute('result', 'inverse');

        const flood = document.createElementNS(svgNS, 'feFlood');
        flood.setAttribute('flood-color', 'black');
        flood.setAttribute('flood-opacity', '1');
        flood.setAttribute('result', 'color');

        const composite2 = document.createElementNS(svgNS, 'feComposite');
        composite2.setAttribute('operator', 'in');
        composite2.setAttribute('in', 'color');
        composite2.setAttribute('in2', 'inverse');
        composite2.setAttribute('result', 'shadow');

        const merge = document.createElementNS(svgNS, 'feMerge');
        const m1 = document.createElementNS(svgNS, 'feMergeNode');
        m1.setAttribute('in', 'SourceGraphic');
        const m2 = document.createElementNS(svgNS, 'feMergeNode');
        m2.setAttribute('in', 'shadow');
        merge.appendChild(m1);
        merge.appendChild(m2);

        filter.append(blur, offset, composite, flood, composite2, merge);
        defs.appendChild(filter);

        // Raised filter (inset highlight + drop shadow)
        const raisedFilter = document.createElementNS(svgNS, 'filter');
        raisedFilter.id = 'raised-filter';
        raisedFilter.setAttribute('x', '-20%');
        raisedFilter.setAttribute('y', '-20%');
        raisedFilter.setAttribute('width', '140%');
        raisedFilter.setAttribute('height', '140%');

        // 1. Inset Highlight (White at top-left)
        const rBlur = document.createElementNS(svgNS, 'feGaussianBlur');
        rBlur.setAttribute('in', 'SourceAlpha');
        rBlur.setAttribute('stdDeviation', '2');
        rBlur.setAttribute('result', 'blur');

        const rOffset = document.createElementNS(svgNS, 'feOffset');
        rOffset.setAttribute('in', 'blur');
        rOffset.setAttribute('dx', '2'); // Shift blur down-right to cut away bottom-right...
        rOffset.setAttribute('dy', '2'); // ...leaving the top-left edge exposed as highlight
        rOffset.setAttribute('result', 'offsetBlur');

        const rComposite = document.createElementNS(svgNS, 'feComposite');
        rComposite.setAttribute('operator', 'out');
        rComposite.setAttribute('in', 'SourceGraphic');
        rComposite.setAttribute('in2', 'offsetBlur');
        rComposite.setAttribute('result', 'inverse');

        const rFlood = document.createElementNS(svgNS, 'feFlood');
        rFlood.setAttribute('flood-color', 'white');
        rFlood.setAttribute('flood-opacity', '0.6');
        rFlood.setAttribute('result', 'highlightColor');

        const rComposite2 = document.createElementNS(svgNS, 'feComposite');
        rComposite2.setAttribute('operator', 'in');
        rComposite2.setAttribute('in', 'highlightColor');
        rComposite2.setAttribute('in2', 'inverse');
        rComposite2.setAttribute('result', 'highlight');

        // 2. Drop Shadow (Black at bottom-right)
        const shadow = document.createElementNS(svgNS, 'feDropShadow');
        shadow.setAttribute('dx', '2');
        shadow.setAttribute('dy', '2');
        shadow.setAttribute('stdDeviation', '2');
        shadow.setAttribute('flood-color', 'black');
        shadow.setAttribute('flood-opacity', '0.5');
        shadow.setAttribute('result', 'dropShadow');

        // Merge: DropShadow (bottom) -> SourceGraphic (middle) -> Highlight (top)
        // Wait, standard order is usually Shadow under Source. Highlight over Source.
        const rMerge = document.createElementNS(svgNS, 'feMerge');

        // Shadow first (bottom layer)
        const rm1 = document.createElementNS(svgNS, 'feMergeNode');
        rm1.setAttribute('in', 'dropShadow');

        // Then SourceGraphic
        const rm2 = document.createElementNS(svgNS, 'feMergeNode');
        rm2.setAttribute('in', 'SourceGraphic');

        // Then Highlight
        const rm3 = document.createElementNS(svgNS, 'feMergeNode');
        rm3.setAttribute('in', 'highlight');

        // Note: feDropShadow applies to SourceGraphic input by default if not specified 'in'.
        // To be safe, let's explicitly chain it or use feMerge correctly.
        // Actually, clearer to apply drop shadow to SourceAlpha then composite?
        // feDropShadow is a filter primitive.
        // Let's keep it simple: Shadow underneath, Source on top, Highlight on very top (inset).

        // Redo merge order:
        // 1. Drop Shadow of SourceAlpha (offset, blur, color)
        // 2. SourceGraphic
        // 3. Inset Highlight

        // Let's construct a manual drop shadow if feDropShadow isn't behaving or for better control.
        const sBlur = document.createElementNS(svgNS, 'feGaussianBlur');
        sBlur.setAttribute('in', 'SourceAlpha');
        sBlur.setAttribute('stdDeviation', '2');
        sBlur.setAttribute('result', 'sBlur');

        const sOffset = document.createElementNS(svgNS, 'feOffset');
        sOffset.setAttribute('in', 'sBlur');
        sOffset.setAttribute('dx', '2');
        sOffset.setAttribute('dy', '2');
        sOffset.setAttribute('result', 'sOffset');

        const sFlood = document.createElementNS(svgNS, 'feFlood');
        sFlood.setAttribute('flood-color', 'black');
        sFlood.setAttribute('flood-opacity', '0.5');
        sFlood.setAttribute('result', 'sColor');

        const sComposite = document.createElementNS(svgNS, 'feComposite');
        sComposite.setAttribute('in', 'sColor');
        sComposite.setAttribute('in2', 'sOffset');
        sComposite.setAttribute('operator', 'in');
        sComposite.setAttribute('result', 'outerShadow');

        rMerge.appendChild(rm1); // We'll reuse nodes but point to correct inputs
        rm1.setAttribute('in', 'outerShadow');
        rMerge.appendChild(rm2);
        rm2.setAttribute('in', 'SourceGraphic');
        rMerge.appendChild(rm3);
        rm3.setAttribute('in', 'highlight');

        raisedFilter.append(
            // Highlight chain
            rBlur, rOffset, rComposite, rFlood, rComposite2,
            // Shadow chain
            sBlur, sOffset, sFlood, sComposite,
            // Merge
            rMerge
        );
        defs.appendChild(raisedFilter);

        const svg = document.createElementNS(svgNS, 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.appendChild(defs);
        document.body.appendChild(svg);
    }

    static create(element) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        const base = getElementSize();
        const size = element.shape === 'switch' ? base : Math.round(base * element.size);

        svg.style.display = 'block';
        svg.style.transformOrigin = 'center';
        svg.style.color = getColor(COLOR_ARRAY[element.color]);

        if (element.height === -1) {
            svg.style.filter = 'url(#sunken-filter) drop-shadow(-1px -1px 1px rgba(0, 0, 0, 1)) drop-shadow(1px 1px 1px rgba(255, 255, 255, 0.5))';
        }

        const draw = (tag, attrs = {}) => {
            const el = document.createElementNS(svgNS, tag);
            Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
            svg.appendChild(el);
            return el;
        };

        switch (element.shape) {
            case 'circle':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    const radius = Math.min(rectWidth, rectHeight) / 2;
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('ellipse', { cx: rectWidth / 2, cy: rectHeight / 2, rx: rectWidth / 2, ry: rectHeight / 2, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('circle', { cx: size / 2, cy: size / 2, r: size / 2, fill: 'currentColor' });
                }
                break;
            case 'rectangle':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('rect', { width: rectWidth, height: rectHeight, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('rect', { width: size, height: size, fill: 'currentColor' });
                }
                break;
            case 'triangle':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    const pts = `${rectWidth / 2},${rectHeight * 0.1} ${rectWidth * 0.1},${rectHeight * 0.9} ${rectWidth * 0.9},${rectHeight * 0.9}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    const pts = `${size / 2},${size * 0.1} ${size * 0.1},${size * 0.9} ${size * 0.9},${size * 0.9}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                }
                break;
            case 'plus':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    const thickness = Math.min(rectWidth, rectHeight) * 0.3;
                    draw('rect', { x: (rectWidth - thickness) / 2, y: rectHeight * 0.1, width: thickness, height: rectHeight * 0.8, fill: 'currentColor' });
                    draw('rect', { x: rectWidth * 0.1, y: (rectHeight - thickness) / 2, width: rectWidth * 0.8, height: thickness, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    const thickness = size * 0.3;
                    draw('rect', { x: (size - thickness) / 2, y: size * 0.1, width: thickness, height: size * 0.8, fill: 'currentColor' });
                    draw('rect', { x: size * 0.1, y: (size - thickness) / 2, width: size * 0.8, height: thickness, fill: 'currentColor' });
                }
                break;
            case 'diamond':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    const pts = `${rectWidth / 2},${rectHeight * 0.05} ${rectWidth * 0.95},${rectHeight / 2} ${rectWidth / 2},${rectHeight * 0.95} ${rectWidth * 0.05},${rectHeight / 2}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    const pts = `${size / 2},${size * 0.05} ${size * 0.95},${size / 2} ${size / 2},${size * 0.95} ${size * 0.05},${size / 2}`;
                    draw('polygon', { points: pts, fill: 'currentColor' });
                }
                break;
            case 'screw':
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const rectWidth = Math.round(base * element.rectWidth);
                    const rectHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${rectWidth} ${rectHeight}`);
                    svg.style.width = `${rectWidth}px`;
                    svg.style.height = `${rectHeight}px`;
                    draw('ellipse', { cx: rectWidth / 2, cy: rectHeight / 2, rx: rectWidth / 2, ry: rectHeight / 2, fill: 'currentColor' });
                    const sw = Math.max(2, Math.min(rectWidth, rectHeight) * 0.1);
                    draw('line', { x1: rectWidth / 2, y1: rectHeight * 0.2, x2: rectWidth / 2, y2: rectHeight * 0.8, stroke: '#333', 'stroke-width': sw });
                    draw('line', { x1: rectWidth * 0.2, y1: rectHeight / 2, x2: rectWidth * 0.8, y2: rectHeight / 2, stroke: '#333', 'stroke-width': sw });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('circle', { cx: size / 2, cy: size / 2, r: size / 2, fill: 'currentColor' });
                    const sw = Math.max(2, size * 0.1);
                    draw('line', { x1: size / 2, y1: size * 0.2, x2: size / 2, y2: size * 0.8, stroke: '#333', 'stroke-width': sw });
                    draw('line', { x1: size * 0.2, y1: size / 2, x2: size * 0.8, y2: size / 2, stroke: '#333', 'stroke-width': sw });
                }
                break;
            case 'switch':
                const swW = Math.round(base * (1 + element.size));
                const swH = base;
                svg.setAttribute('viewBox', `0 0 ${swW} ${swH}`);
                svg.style.width = `${swW}px`;
                svg.style.height = `${swH}px`;
                const pill = draw('rect', { x: 2, y: 2, width: swW - 4, height: swH - 4, rx: (swH - 4) / 2, fill: 'currentColor' });
                pill.classList.add('switch-pill', 'sunken');
                pill.style.pointerEvents = 'none';
                const br = Math.round(base * 0.95) / 2;
                const ballColor = element.ballColor !== null ? getColor(COLOR_ARRAY[element.ballColor]) : getColor(COLOR_ARRAY[0]);
                const b = draw('circle', { cx: br + 2, cy: swH / 2, r: br, fill: ballColor });
                b.classList.add('switch-ball', 'raised');
                b.style.pointerEvents = 'auto';
                b.style.cursor = 'pointer';
                break;
            case 'tumbler':
                // Tumbler is always size 2 (perfect circle)
                const tumblerSize = base * 2;
                svg.setAttribute('viewBox', `0 0 ${tumblerSize} ${tumblerSize}`);
                svg.style.width = svg.style.height = `${tumblerSize}px`;
                // Draw the main circle
                draw('circle', { cx: tumblerSize / 2, cy: tumblerSize / 2, r: tumblerSize / 2, fill: 'currentColor' });
                // Draw the keyhole (dark rectangle positioned like a minute hand at 6 o'clock)
                // Keyhole matches key size: 0.3 (30% width) x 0.8 (80% height) of tumbler
                const keyholeWidth = tumblerSize * 0.3;
                const keyholeHeight = tumblerSize * 0.8;
                const keyholeX = (tumblerSize - keyholeWidth) / 2;
                const keyholeY = tumblerSize * 0.2; // Start from 10% down (centered vertically)
                const keyhole = draw('rect', {
                    x: keyholeX,
                    y: keyholeY,
                    width: keyholeWidth,
                    height: keyholeHeight,
                    fill: '#232222ff',
                    rx: keyholeWidth * 0.2
                });
                keyhole.classList.add('sunken');
                keyhole.classList.add('tumbler-keyhole'); // Add class for targeting
                keyhole.style.filter = 'url(#sunken-filter)';
                break
            case 'key':
                // Key is a simple rectangle matching the keyhole size
                if (element.rectWidth !== undefined && element.rectHeight !== undefined) {
                    const keyWidth = Math.round(base * element.rectWidth);
                    const keyHeight = Math.round(base * element.rectHeight);
                    svg.setAttribute('viewBox', `0 0 ${keyWidth} ${keyHeight}`);
                    svg.style.width = `${keyWidth}px`;
                    svg.style.height = `${keyHeight}px`;
                    draw('rect', { x: 0, y: 0, width: keyWidth, height: keyHeight, fill: 'currentColor', rx: Math.min(keyWidth, keyHeight) * 0.2 });
                } else {
                    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
                    svg.style.width = svg.style.height = `${size}px`;
                    draw('rect', { x: 0, y: 0, width: size, height: size, fill: 'currentColor', rx: size * 0.1 });
                }
                break;
            case 'semicircle_left':
                svg.setAttribute('viewBox', `0 0 ${size / 2} ${size}`);
                svg.style.width = `${size / 2}px`;
                svg.style.height = `${size}px`;
                draw('path', { d: `M ${size / 2},0 A ${size / 2},${size / 2} 0 0 0 ${size / 2},${size} Z`, fill: 'currentColor' });
                break;
            case 'semicircle_right':
                svg.setAttribute('viewBox', `0 0 ${size / 2} ${size}`);
                svg.style.width = `${size / 2}px`;
                svg.style.height = `${size}px`;
                draw('path', { d: `M 0,0 A ${size / 2},${size / 2} 0 0 1 0,${size} Z`, fill: 'currentColor' });
                break;
            case 'semicircle_down':
                svg.setAttribute('viewBox', `0 0 ${size} ${size / 2}`);
                svg.style.width = `${size}px`;
                svg.style.height = `${size / 2}px`;
                draw('path', { d: `M 0,0 A ${size / 2},${size / 2} 0 0 0 ${size},0 Z`, fill: 'currentColor' });
                break;
            case 'semicircle_up':
                svg.setAttribute('viewBox', `0 0 ${size} ${size / 2}`);
                svg.style.width = `${size}px`;
                svg.style.height = `${size / 2}px`;
                draw('path', { d: `M 0,${size / 2} A ${size / 2},${size / 2} 0 0 1 ${size},${size / 2} Z`, fill: 'currentColor' });
                break;
        }
        return svg;
    }
};
