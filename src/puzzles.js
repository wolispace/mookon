const puzzleConfigs = [
    `
Job done! [pencil]
/
blue:
r1 1x2 1x1 0 2,
w1 1x2 3x3 0 0-6-3 tap state 1 r1 drag move,
`,
    `
Congrats! [book]
/
green:
w1 3 3x3 0 0-5-0 tap state 2,
/
blue:
w1 1 3x3 0 0-5-0 tap state 1,
w1 1 3x4 0 0-5-0 tap state 1,
/
green:
w1 1 3x3 0 0-2-4 tap state 1,
c1 1 3x4.5+ 0 2 drag,   
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
w1 2 2.2x3.5 0 0-6-0 tap state 2,
r11 2 2x3 0 3 tap color 6 r11 drag move,
r12 2 4x3 0 3,
r13 2 6x3 0 3,
`,
    `Great! [star]
/
blue:
r1 6x0.1 1x6+ 0 3,  
r2 6x0.1 1x8+ 0 3,
r3 0.1x2 1x6+ 0 3, 
r4 0.1x2 7x6+ 0 3, 
w2 1 1.3x6.5 0 0-5-0 tap state 1,
r5 1.7+ 1.1x6.2 0 2 drag,
c1 .5 3.5x6.7- 0 1, 
s4 1.4 3x6.4+ 0 2 hold rotate 3 s4 drag,

`,
    `Check! [dice]
/blue:
r10 1 0x0 0 0,
r11 1 2x0 0 0,
r12 1 4x0 0 0,
r13 1 6x0 0 0,

r20 1 1x1 0 0,
r21 1 3x1 0 0,
c2 .85 5.1x1.1+ 0 1 tap color 3 c2 drag,
r22 1 5x1 0 0 tap color 2 r22 drag,
r23 1 7x1 0 0,

r30 1 0x2 0 0,
r31 1 2x2 0 0,
r32 1 4x2 0 0,
r33 1 6x2 0 0,

r40 1 1x3 0 0,
r41 1 3x3 0 0,
r42 1 5x3 0 0,
r43 1 7x3 0 0,

r50 1 0x4 0 0,
r51 1 2x4 0 0,
r52 1 4x4 0 0,
r53 1 6x4 0 0,

r60 1 1x5 0 0,
r61 1 3x5 0 0,
r62 1 5x5 0 0,
r63 1 7x5 0 0,

c0 .85 0x6- 0 1 =,
r70 1 0x6 0 0 tap color 2 r70 drag,
r71 1 2x6 0 0,
r72 1 4x6 0 0,
r73 1 6x6 0 0,

r80 1 1x7 0 0,
r81 1 3x7 0 0,
r82 1 5x7 0 0,
r83 1 7x7 0 0,

`,
    `Woo hoo!
/
red:
c1 1.4 1x0.5- 0 1 =,
c2 1.8 1x2.1- 0 1 =,
c3 1 1x4.1- 0 1 =,
c4 1.4 1x5.5- 0 1,
c5 1 4x1 0 4 drag,
c6 1.4 4x3 0 4 drag,
c7 1.8 4x5 0 4 drag
`,
    `Success!
/
green:
t0 1.8 1x1 0 1,
t1 1.8 3x1- 0 1 =,
t3 1.8 5x1 0 1,
c2 1 1.5x3.5- 0 1,
s3 1.8 1x3+ 0 0 hold rotate 3 s3 drag move
/
red:
c0 1 1x1- 0 1,
s1 1.4 1x1+ 0 0 hold rotate 3 s1 drag move,
t2 1.8 1x3 0 3 tap color 5 t2 drag,
c1 1.8 4x4 0 1 drag,
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

];

const testConfigs = [

    ,

    `Confetti!!:
/
red:
w1 1 4x2 0 0-2-0 tap state 1,
/
blue:
w4 1 1x1 0 0-2-0 tap state 1,
r1 1 1x2 0 2,
c1 1 1x3 0 2,
s1 1 1x4 0 2,
t1 1 1x5 0 2,
r2 0.1x1 1x6 0 2,
w4 1 3x1- 0 0-2-0 tap state 1,
r3 1 3x2- 0 2,
c2 1 3x3- 0 2,
s2 1 3x4- 0 2,
t2 1 3x5- 0 2,
r4 0.1x1 3x6- 0 2,
w5 1 5x1+ 0 0-2-0 tap state 1,
r5 1 5x2+ 0 2,
c3 1 5x3+ 0 2,
s3 1 5x4+ 0 2,
t3 1 5x5+ 0 2,
r6 0.1x1 5x6+ 0 2,
/
`,
    `
Loading
: hunt + maze
/
green:
c32 1 6x6- 0 3 =,
c30 1 1x4+ 0 1,
c31 1 2x3+ 0 1 tap color 3 c31 drag move
/
red:
c48 1 6x5- 0 1,
c2 1 0x0+ 0 3,
c3 1 1x0+ 0 3,
c4 1 2x0+ 0 3,
c5 1 3x0+ 0 3,
c6 1 4x0+ 0 3,
c8 1 6x0+ 0 3,
c9 1 7x0+ 0 3,
c10 1 0x1+ 0 3,
c14 1 4x1+ 0 3,
c16 1 6x1+ 0 3,
c17 1 7x1+ 0 3,
c18 1 0x2+ 0 3,
c20 1 2x2+ 0 3,
c22 1 4x2+ 0 3,
c24 1 6x2+ 0 3,
c25 1 7x2+ 0 3,
c26 1 0x3+ 0 3,
c28 1 2x3+ 0 3,
c32 1 6x3+ 0 3,
c33 1 7x3+ 0 3,
c34 1 0x4+ 0 3,
c36 1 2x4+ 0 3,
c37 1 3x4+ 0 3,
c38 1 4x4+ 0 3,
c39 1 5x4+ 0 3,
c40 1 6x4+ 0 3,
c41 1 7x4+ 0 3,
c42 1 0x5+ 0 3,
c50 1 0x6+ 0 3,
c51 1 1x6+ 0 3,
c52 1 2x6+ 0 3,
c53 1 3x6+ 0 3,
c54 1 4x6+ 0 3,
c55 1 5x6+ 0 3,
c56 1 6x6+ 0 3,
c57 1 7x6+ 0 3,
c58 1 0x7+ 0 3,
c59 1 1x7+ 0 3,
c60 1 2x7+ 0 3,
c61 1 3x7+ 0 3,
c62 1 4x7+ 0 3,
c63 1 5x7+ 0 3,
c64 1 6x7+ 0 3,
c65 1 7x7+ 0 3 
`,

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