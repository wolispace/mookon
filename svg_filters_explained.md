# SVG Filter Primitives Explained

Here's a breakdown of the properties used in the `raised-filter` to help you tweak the effect.

## 1. Inset Highlight (White)

This part creates the white "lit" edge inside the shape.

### `feGaussianBlur` (`rBlur`)
- **`stdDeviation`**: Controls the softness of the highlight.
  - Current: `2`
  - Tweak: Increase for a softer, more diffuse light. Decrease for a harder, sharper edge.

### `feOffset` (`rOffset`)
- **`dx` / `dy`**: Moves the blurred copy relative to the original. This determines *where* the highlight appears.
  - Current: `dx="-2"`, `dy="-2"`
  - **Correction**: To make the highlight appear on the **top-left** inside the shape, we actually need to shift the "cutter" (the blurred copy) to the *bottom-right*.
  - **Try**: `dx="2"`, `dy="2"` (Counter-intuitive! See explanation below)

### `feComposite` (`rComposite`) - The "Cutter"
- **`operator="out"`**: This subtracts the blurred/offset copy from the original shape.
  - Source: `SourceGraphic` (Original Shape)
  - Destination: `offsetBlur` (Shifted Blur)
  - Result: Only the parts of the Original Shape that *don't* overlap with the Shifted Blur remain.
  - **Why the offset matters**: If we shift the blur down-right (`2, 2`), it leaves the top-left edge of the original shape exposed. This exposed edge becomes our highlight.

### `feFlood` (`rFlood`) & `feComposite` (`rComposite2`) - Coloring
- **`flood-color`**: Sets the highlight color (White).
- **`flood-opacity`**: Controls brightness.
  - Current: `0.6`
  - Tweak: Increase for brighter highlights.
- **`operator="in"`**: Paints the white color *into* the sliver we cut out in the previous step.

---

## 2. Drop Shadow (Black)

This part creates the shadow underneath the shape.

### `feGaussianBlur` (`sBlur`)
- **`stdDeviation`**: Softness of the shadow.
  - Current: `2`

### `feOffset` (`sOffset`)
- **`dx` / `dy`**: Direction of the shadow.
  - Current: `2`, `2` (Bottom-Right)
  - This is standard for a light source coming from Top-Left.

### `feFlood` & `feComposite` (`sComposite`) - Coloring
- **`flood-opacity`**: Darkness of the shadow.
  - Current: `0.5`

## Summary of Fix

To move the white inset highlight to the **top-left**:
Update `rOffset` to use **positive values** (`dx="2"`, `dy="2"`).

Why? Because we are *cutting away* the bottom-right part of the shape using the offset blur, leaving only the top-left edge remaining.
