const puzzleConfigs = [
    `NO go [star]
    / white:
u39 2x2 6x4 0 8 hold rotate 4,
u41 2x2 4x1 0 0 hold rotate 4,
k40 0.6x1.6 5x3+ 0 8 drag,
k42 0.6x1.6 1x1+ 0 0 drag,
d43 1.07x1.86 0.5x0.41+ 0 6 tap color 3 d43 drag `,
    `Simples! [star]
/
blue:
w1 1x1 3x3 0 0-6-3 tap state 1,
`, `
Simples! [basketball]
/
red:
q1 1x1 3x3- 0 2 #,
q2 1x1 1x3+ 0 2 drag,
q3 1x1 5x3+ 0 3 drag,
 `,

    `
You found it! [trophy]
/
blue:
r1 2 0x1 0 3,
r2 2 2x1 0 3,
r3 2 4x1 0 3,
r4 2 6x1 0 3,
r10 2 0x3 0 3,
w1 1 2.2x3.5 0 0-6-0 tap state 1,
r11 2 2x3 0 3 tap color 6 r11 drag move,
r12 2 4x3 0 3,
r13 2 6x3 0 3,
`,

    `Way to move!
/
grey:
r0 1 2x1+ 0 0 tap c0 0x-.5,
r1 1 1x2+ 0 0 tap c0 -.5x0,
r3 1 2x2+ 0 0 tap c0 0x.5,
r2 1 3x2+ 0 0 tap c0 .5x0,

c0 1 3x1+ 0 3,
r9 8x0.1 0x0+ 0 0,
c1 1 7x7- 0 1 =,
`,
    ` Well done! [subway]
/
orange:
c2 1x1 0.5x0.5- 0 1 =,
c5 1x1 6.5x6.5- 0 1 =,
s1 2x2 0x0+ 0 0 hold rotate 3 s1 drag move,
s4 2x2 6x6+ 0 0 hold rotate 3 s4 drag move
/
blue:
c7 1x1 2x1^ 0 8 none,
c8 1x1 3x1^ 0 8 tap color 2 c8 drag move,
c9 1x1 4x1^ 0 8 none,
c10 1x1 5x1^ 0 8 none,
c11 1x1 2x2^ 0 8 none,
c12 1x1 3x2^ 0 8 none,
c13 1x1 4x2^ 0 8 none,
c14 1x1 5x2^ 0 8 none
/
red:
c16 0.5x0.5 0.25x0.25- 0 1,
c18 0.5x0.5 0.25x7.25- 0 1,
s15 1x1 0x0+ 0 0 hold rotate 3 s15 drag move,
s17 1x1 0x7+ 0 0 hold rotate 3 s17 drag move,
c3 2x2 7x0+ 0 2 state 0 state 1 drag,
r20 1x1 3x6+ 0 0 tap p19 0x-0.5,
r21 1x1 4x7+ 0 0 tap p19 -0.5x0,
r22 1x1 5x6+ 0 0 tap p19 0x0.5,
r23 1x1 6x7+ 0 0 tap p19 0.5x0,
p19 1.21x1.2 0x0+ 0 8 none,
t24 1.09x1 0x0+ 0 1 tap color 4 t24 drag,
r25 1.28x1.14 0x0+ 0 5 tap color 4 r25 drag,
s26 1.42x1.21 0x6.79+ 0 1 hold rotate 1 s26 drag,
c27 1x1 5x0+ 0 6 drag,
c28 1x1 6x0+ 0 0 drag,
c29 1x1 5x1+ 0 8 drag,
c30 1x1 6x1+ 0 7 drag,
c31 1x1 7x1+ 0 7 drag,
c32 1x1 2x5+ 0 2 tap c3 size,
c33 1x1 2x3+ 0 3 tap c3 size
/
black:
p34 2x2 3x2- 0 0 =,
c36 2x2 0x5- 0 5 #,
r38 2.98x2.93 0x4.54+ 0 0 tap color 0 r38 drag,
d39 1.88x2.18 0x4.36+ 0 6 drag
/
white:
w40 1x1 1x1 0 4-5-8 tap state 1,
w41 4x1 1x2 0 4-5-8 tap state 1,
w42 5x1 1x3 0 4-5-8 tap state 5,
w43 1x1 1x4 0 4-5-8 tap state 1
/
yellow:
t44 1x1 6x3- 0 2 #,
d46 1x1 2x0- 0 6 #,
r48 2x2 2x2- 0 0 #,
r49 2x2 0x1+ 0 0 drag,
t45 1x1 4x6+ 0 2 drag,
d47 1x1 2x4+ 0 6 drag,
c37 2x2 5x1+ 0 5 drag
/
black:
w50 5x1 0x4 0 3-7-4 tap state 3,
w51 1x1 0x5 0 3-7-4 tap state 1,
w52 3x1 0x6 0 3-7-4 tap state 3,
w53 1x1 0x7 0 3-7-4 tap state 1,
p35 2x2 4x5+ 0 0 drag `,

    `Amazing! [comment]
/
orange:
c2 1x1 0.5x0.5- 0 1 =,
c5 1x1 6.5x0.5- 0 1 #,
w7 4x1 0x6 0 5-3-8 tap state 3,
w8 4x1 0x7 0 5-3-8 tap state 4,
s1 2x2 0x0+ 0 3 hold rotate 3 s1 drag move,
s4 2x2 6x0+ 0 3 hold rotate 3 s4 drag move
/
red:
p9 1x1 2x0- 0 0 #,
r11 2x2 4x5- 0 4 #,
t13 1x1 4x1- 0 4 #,
p10 1x1 1x2+ 0 0 drag,
c3 1x1 7x3+ 0 2 drag,
r15 2x2 6x5+ 0 6 drag,
r16 2.96x2.99 3.52x4.51+ 0 7 drag,
k17 2.67x2.63 3.67x4.69+ 0 7 tap color 1 k17 drag,
k18 2.39x2.23 3.56x0.64+ 0 7 drag,
d19 1.68x1.78 3.49x0.42+ 0 4 tap color 3 d19 drag,
c20 1x1 6x3+ 0 2 drag
/
blue:
w23 4x1 0x2 0 5-8-3 tap state 3,
w24 5x1 0x3 0 5-8-3 tap state 3,
w25 2x1 0x4 0 5-8-3 tap state 1,
w26 3x1 0x5 0 5-8-3 tap state 1,
u27 2x2 3x0 0 3 hold rotate 4,
c30 1x1 0.5x0.5- 0 1,
c32 1x1 6.5x0.5- 0 1,
c34 1x1 0.5x6.5- 0 1 =,
c37 1x1 6.5x6.5- 0 1,
s29 2x2 0x0+ 0 0 hold rotate 3 s29 drag move,
s31 2x2 6x0+ 0 0 hold rotate 3 s31 drag move,
s33 2x2 0x6+ 0 0 hold rotate 3 s33 drag move,
s36 2x2 6x6+ 0 0 hold rotate 3 s36 drag move,
c35 1x1 2x6+ 0 2 none,
c6 1x1 6x5+ 0 1 drag,
c38 4.54x1.54 0x1.73+ 0 5 drag,
k39 4.89x1.69 0x1.66+ 0 8 drag,
r40 4.26x1.45 0x1.9+ 0 5 tap color 5 r40 drag,
k41 1.85x1.99 0.07x0.01+ 0 1 tap color 0 k41 drag,
r42 1.63x1.71 0.19x6.15+ 0 7 tap color 3 r42 drag,
k43 1.52x1.92 1.74x5.54+ 0 3 drag,
c44 1x1 3x6+ 0 1 drag,
r46 1x1 4x4+ 0 2 tap c35 0x-0.5,
r47 1x1 5x5+ 0 2 tap c35 -0.5x0,
r48 1x1 6x4+ 0 2 tap c35 0x0.5,
r49 1x1 7x5+ 0 2 tap c35 0.5x0
/
blue:
w51 5x1 0x6 0 4-3-7 tap state 3,
k141 1.85x1.99 0.07x0.01+ 0 1 tap color 0 k141 drag,
r11 2 2x3+ 0 3 tap color 6 r11 drag,
k28 0.6x1.6 6x5+ 0 3 drag `,
];

/*
Rules for making an interesting puzzle:

Build the panels sequentially from the final panel, up to the first panel.

Always create pairs of a sunken element that needs filling with its filling shape.

Please the holes first on a panel, then place its pair on the same or a later panel.

Cover elements to make them harder to find.
- a key element can be covered by another than has to be moved to reveal it
- cover the cover with another cover, each needs a diffeent mans of moving it
- eg a switch covered with a large circle that must be manually dragged out the way,is covered with a larger square that is remote control moved out the way etc..

Hide things in groups: 
- a group of 5 circles but only one is the key we need.
- an array of flat idential squares side by side will look like a rectangle and keed careful examination to find the key one we need.

Block movement:
- limit how an element can move using raised lines and other elements.

I like the idea of 'maze' as a fundction.. but that need to intelegently build a random maze or raised elements of random types, and must logically constrain the movable element.

I like the idea of having named fnctions for the concepts by these should have randomness and several can be combined on one panel.

For example build a maze by fulling a panel qith squares in a grid, then removing some to make a maze with a movable piece within the maze, and its tarige hole also in the maze shape, then use another function to cover part of the maze with curcles, wich have to be interacted with before the cqan be moved, and the maze completed.

Or a maze with an opening, but no movable piece, that has been extracted from the maze panel and put on a subsequent panel to the user finds it first, then when they get to the maze panel they have to drag the emeent into the element via the opening to complete the panel.

And thats just teo panels... there should be more, each panel ideally using some element from a previous panel.. not not all the time (random)

NOTE: when placing raised elements they must be added later to the config so bothing is drawn over the top as configs are processed sequentially.

*/