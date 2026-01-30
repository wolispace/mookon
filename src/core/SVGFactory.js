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
        }
        return svg;
    }
};
