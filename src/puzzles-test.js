const debugPuzzleConfigs = [
    `
     You did it! [shower]
/
orange:
c18 1x1 3x1- 0 1 =,
w20 1x1 4x6 0 3-7-6 tap state 9 c18 reset,
c19 1x1 6x6+ 0 2 drag, 
w1 1x1 1x7 0 3-7-6 tap state 1,
`,
    // 1. Hole: Basic
    `Puzzle Solved! [heart]
/
grey:
c2 1x1 0x0- 0 2 =,
c3 1x1 3x0+ 0 2 drag`,

    // 2. Hole: Color Match
    `You did it! [vials]
/
white:
p5 1x1 0x5- 0 6 =,
t8 1x1 2x0- 0 6 =,
p11 2x2 5x4- 0 4 #,
p12 2x2 4x0+ 0 4 drag,
t9 1x1 1x3+ 0 6 drag,
p6 1x1 3x3+ 0 6 drag`,

    // 3. Screw: Corners
    `Congratulations! [donate]
/
red:
c14 1x1 0.5x6.5- 0 1 =,
c17 1x1 6.5x6.5- 0 1 =,
s13 2x2 0x6+ 0 0 hold rotate 3 s13 drag move,
s16 2x2 6x6+ 0 0 hold rotate 3 s16 drag move,
c15 1x1 2x3+ 0 2 drag,
c18 1x1 2x6+ 0 2 drag`,

    // 4. Switch: States
    `You're a wiz! [industry]
/
blue:
w19 2x1 4x1 0 4-6-2 tap state 2`,

    // 5. Maze: Navigate
    `Nicely done! [warehouse]
/
orange:
c43 1x1 1x1- 0 1 =,
r20 1x1 0x0+ 0 8,
r21 1x1 1x0+ 0 8,
r22 1x1 2x0+ 0 8,
r23 1x1 3x0+ 0 8,
r24 1x1 4x0+ 0 8,
r25 1x1 5x0+ 0 8,
r26 1x1 6x0+ 0 8,
r27 1x1 0x1+ 0 8,
r28 1x1 4x1+ 0 8,
r29 1x1 6x1+ 0 8,
r30 1x1 0x2+ 0 8,
r31 1x1 1x2+ 0 8,
r32 1x1 2x2+ 0 8,
r33 1x1 4x2+ 0 8,
r34 1x1 6x2+ 0 8,
r35 1x1 0x3+ 0 8,
r36 1x1 6x3+ 0 8,
r37 1x1 0x4+ 0 8,
r38 1x1 1x4+ 0 8,
r39 1x1 2x4+ 0 8,
r40 1x1 4x4+ 0 8,
r41 1x1 5x4+ 0 8,
r42 1x1 6x4+ 0 8,
c44 1x1 7x5+ 0 1 drag`,

    // 6. Group: Find Key
    `Nicely done! [tag]
/
white:
p45 1.73x1.04 0x1^ 0 3 none,
p46 1.73x1.04 3.46x1^ 0 3 tap color 2 p46 drag move,
p47 1.73x1.04 1.73x2.04^ 0 3 none,
p48 1.73x1.04 0x3.08^ 0 3 none,
p49 1.73x1.04 3.46x3.08^ 0 3 tap color 2 p49 drag move`,

    // 7. Tumbler: Unlock
    `Great job! [tablet]
/
grey:
u50 2x2 2x3 0 0 hold rotate 4,
k51 0.6x1.6 1x5+ 0 0 drag`,

    // 8. Cover: Physical
    `Great job! [id-card]
/
teal:
s53 2x2 2x4- 0 6 =,
s54 2x2 4x6+ 0 6 drag,
r55 2.75x2.52 1.63x3.74+ 0 1 tap color 2 r55 drag`,

    // 9. Cover: Group Obscure
    `Way to go! [chess-knight]
/
grey:
w56 2x1 4x1 0 7-5-4 tap state 1,
w57 3x1 4x2 0 7-5-4 tap state 2,
w58 3x1 4x3 0 3-5-4 tap state 3`,

    // 10. Cover: Remote Only
    `You're a wiz! [circle-notch]
/
green:
r60 2x2 6x6- 0 0 none,
t63 2x2 0x4- 0 5 =,
t64 2x2 3x2+ 0 5 drag,
r61 2x2 0x1+ 0 0 drag,
r66 1x1 4x0+ 0 6 tap r60 0x-0.5,
r67 1x1 5x1+ 0 6 tap r60 -0.5x0,
r68 1x1 6x0+ 0 6 tap r60 0x0.5,
r69 1x1 7x1+ 0 6 tap r60 0.5x0`,

    // 11. Cover: Switch Release
    `Well done! [universal-access]
/
teal:
c71 1x1 6.5x0.5- 0 1 none,
c74 1x1 6.5x6.5- 0 1 =,
w77 1x1 6x2 0 4-2-8 tap state 1 c71 drag,
s70 2x2 6x0+ 0 0 hold rotate 3 s70 drag move,
s73 2x2 6x6+ 0 0 hold rotate 3 s73 drag move,
c72 1x1 1x2+ 0 2 drag,
c75 1x1 4x0+ 0 2 drag`,

    // 12. Cover: Size Obscure
    `Great job! [heartbeat]
/
teal:
k79 0.6x1.6 3x1- 0 1 =,
t82 1x1 5x6- 0 0 #,
k85 0.6x1.6 3x5- 0 6 #,
t83 1.25x1.25 0x3+ 0 0 state 1 drag,
k80 0.6x1.6 3x3+ 0 1 drag,
k86 0.6x1.6 0x2+ 0 6 drag,
c87 1x1 2x5+ 0 2 tap t83 size`,

    // 13. Cover: Reset Trap
    `Nicely done! [sign-language]
/
red:
c89 1x1 0x0- 0 5 #,
c90 1x1 0x4+ 0 5 drag`,

    // 14. Multi: Hole + Screw
    `You did it! [sync]
/
grey:
s92 1x1 7x6- 0 0 =,
c95 1x1 0.5x0.5- 0 1 =,
c98 1x1 6.5x0.5- 0 1 =,
c101 1x1 0.5x6.5- 0 1 #,
s94 2x2 0x0+ 0 4 hold rotate 3 s94 drag move,
s97 2x2 6x0+ 0 4 hold rotate 3 s97 drag move,
s100 2x2 0x6+ 0 4 hold rotate 3 s100 drag move,
c102 1x1 2x0+ 0 1 drag,
c99 1x1 3x0+ 0 2 drag,
c96 1x1 4x5+ 0 2 drag,
s93 1x1 4x2+ 0 0 drag`,

    // 15. Multi: Switch + Maze
    `Puzzle Solved! [hand-point-left]
/
red:
w103 1x1 0x5 0 2-5-1 tap state 1,
w104 1x1 0x6 0 3-5-1 tap state 1,
w105 4x1 0x7 0 4-5-1 tap state 2,
c123 1x1 1x1- 0 1 =,
r106 1x1 0x0+ 0 8,
r107 1x1 1x0+ 0 8,
r108 1x1 2x0+ 0 8,
r109 1x1 3x0+ 0 8,
r110 1x1 4x0+ 0 8,
r111 1x1 0x1+ 0 8,
r112 1x1 2x1+ 0 8,
r113 1x1 4x1+ 0 8,
r114 1x1 0x2+ 0 8,
r115 1x1 2x2+ 0 8,
r116 1x1 4x2+ 0 8,
r117 1x1 0x3+ 0 8,
r118 1x1 4x3+ 0 8,
r119 1x1 0x4+ 0 8,
r120 1x1 1x4+ 0 8,
r121 1x1 3x4+ 0 8,
r122 1x1 4x4+ 0 8,
c124 1x1 5x1+ 0 1 drag`,

    // 16. Stack: Physical + Remote
    `You did it! [filter]
/
grey:
d126 1x1 2x3- 0 2 =,
d127 1x1 2x1+ 0 2 drag,
r129 1x1 4x6+ 0 6 tap r128 0x-0.5,
r130 1x1 5x7+ 0 6 tap r128 -0.5x0,
r131 1x1 6x6+ 0 6 tap r128 0x0.5,
r132 1x1 7x7+ 0 6 tap r128 0.5x0,
r128 2.08x2.01 1.71x2.75+ 0 5 none`,

    // 17. Shapes: All Types
    `Amazing! [address-book]
/
orange:
s134 2x2 3x5- 0 5 =,
p137 1x1 6x6- 0 2 #,
c140 1x1 3x1- 0 4 =,
c141 1x1 5x2+ 0 4 drag,
p138 1x1 6x3+ 0 2 drag,
s135 2x2 3x2+ 0 5 drag`,

    // 18. Multi-panel 1
    `Amazing! [book]
/
red:
s143 2x2 2x6- 0 3 =,
r146 1x1 2x5- 0 5 #,
r147 1x1 2x2+ 0 5 drag,
s144 2x2 3x4+ 0 3 drag`,

    // 19. Multi-panel 2
    `Great job! [file]
/
yellow:
r149 2x2 5x6- 0 5 =,
r150 2x2 1x1+ 0 5 drag`,

    // 20. Group: All Fill
    `Great job! [bolt]
/
teal:
s151 1.88x1.69 1.88x2^ 0 4 none,
s152 1.88x1.69 3.76x2^ 0 4 none,
s153 1.88x1.69 5.64x2^ 0 4 none,
s154 1.88x1.69 0x3.69^ 0 4 none,
s155 1.88x1.69 1.88x3.69^ 0 4 tap color 0 s155 drag move,
s156 1.88x1.69 3.76x3.69^ 0 4 none,
s157 1.88x1.69 5.64x3.69^ 0 4 tap color 0 s157 drag move`,

    // 21. Maze: Multi-Socket
    `You're a wiz! [dna]
/
teal:
c181 1x1 1x1- 0 1 =,
r158 1x1 0x0+ 0 8,
r159 1x1 1x0+ 0 8,
r160 1x1 2x0+ 0 8,
r161 1x1 3x0+ 0 8,
r162 1x1 4x0+ 0 8,
r163 1x1 5x0+ 0 8,
r164 1x1 6x0+ 0 8,
r165 1x1 0x1+ 0 8,
r166 1x1 4x1+ 0 8,
r167 1x1 6x1+ 0 8,
r168 1x1 0x2+ 0 8,
r169 1x1 1x2+ 0 8,
r170 1x1 2x2+ 0 8,
r171 1x1 4x2+ 0 8,
r172 1x1 6x2+ 0 8,
r173 1x1 0x3+ 0 8,
r174 1x1 6x3+ 0 8,
r175 1x1 0x4+ 0 8,
r176 1x1 1x4+ 0 8,
r177 1x1 2x4+ 0 8,
r178 1x1 4x4+ 0 8,
r179 1x1 5x4+ 0 8,
r180 1x1 6x4+ 0 8,
c182 1x1 3x7+ 0 1 drag`,

    // 22. Screw: Hide Holes
    `Puzzle Solved! [spinner]
/
blue:
c184 1x1 0.5x0.5- 0 1 #,
c187 1x1 6.5x0.5- 0 1 =,
c190 1x1 0.5x6.5- 0 1 =,
c193 1x1 6.5x6.5- 0 1 =,
s183 2x2 0x0+ 0 4 hold rotate 3 s183 drag move,
s186 2x2 6x0+ 0 4 hold rotate 3 s186 drag move,
s189 2x2 0x6+ 0 4 hold rotate 3 s189 drag move,
s192 2x2 6x6+ 0 4 hold rotate 3 s192 drag move,
c185 1x1 2x0+ 0 1 drag,
c194 1x1 2x5+ 0 2 drag,
c188 1x1 0x4+ 0 2 drag,
c191 1x1 3x0+ 0 2 drag`,

    // 23. Switch + Tumbler
    `Congratulations! [sync-alt]
/
red:
w195 4x1 0x4 0 1-6-5 tap state 3,
w196 3x1 0x5 0 1-6-5 tap state 1,
w197 5x1 0x6 0 1-6-5 tap state 2,
w198 2x1 0x7 0 1-6-5 tap state 1,
u199 2x2 5x4 0 2 hold rotate 4,
k200 0.6x1.6 7x4+ 0 2 drag`,

    // 24. Size: Multiple
    `Congratulations! [moon]
/
teal:
t202 1x1 3x2- 0 1 =,
c205 2x2 1x5- 0 0 #,
s208 2x2 4x6- 0 1 =,
c206 1.5x1.5 0x1+ 0 0 state 5 drag,
s209 2x2 6x0+ 0 1 drag,
t203 1x1 2x0+ 0 1 drag,
c210 1x1 6x3+ 0 2 tap c206 size`,

    // 25. Reset: Maze Ball
    `Well done! [clock]
/
yellow:
c228 1x1 1x1- 0 1 #,
r211 1x1 0x0+ 0 0,
r212 1x1 1x0+ 0 0,
r213 1x1 2x0+ 0 0,
r214 1x1 3x0+ 0 0,
r215 1x1 4x0+ 0 0,
r216 1x1 0x1+ 0 0,
r217 1x1 4x1+ 0 0,
r218 1x1 0x2+ 0 0,
r219 1x1 1x2+ 0 0,
r220 1x1 2x2+ 0 0,
r221 1x1 4x2+ 0 0,
r222 1x1 0x3+ 0 0,
r223 1x1 4x3+ 0 0,
r224 1x1 0x4+ 0 0,
r225 1x1 1x4+ 0 0,
r226 1x1 2x4+ 0 0,
r227 1x1 4x4+ 0 0,
c229 1x1 5x4+ 0 1 drag`,

];