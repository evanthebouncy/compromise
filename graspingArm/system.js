function get_system() {
  var system = {
    // current best negotiated constraints
    box_x : [300, 500],      // where the box's x position when down
    hand_up_x : [300, 500],  // where's the hand's x position when up
    hand_up_y : [250, 400],  // where's the hand's y position when up
    hand_down_x : [300, 500],
    hand_down_y : [250, 500],

    // current best states
    A : undefined, // hand up with box up, holding vertex 1
    B : undefined, // hand whatever but box down, vertex 1 on left
    C : undefined, // hand up and box down, vertex 1 on left
    D : undefined, // hand down with box down, holding vertex 2 on right
    E : undefined, // hand up with box up, holding vertex 2 (implemented by A, it's symmetric)

    // current best functions
    f1 : undefined, // goes from A to B
    f2 : undefined, // goes from B to C
    f3 : undefined, // goes from C to D
    f4 : undefined, // goes from D to E
    

    // state -> constraint dependencies
    dep : {}

    // state -> function mapping (as image/domain relation)

    // function -> state mapping (as pre/post condition relation)
  }
  
  // hand up box up, holding v1
  system.A = Abar(system.hand_up_x, system.hand_up_y)
  // box down
  system.B = Bbar(system.box_x)
  // hand up box down
  system.C = Cbar(system.hand_up_x, system.hand_up_y, system.box_x)
  // hand down box down, holding v2
  system.D = Dbar(system.box_x)
  // hand up box up, holding v2
  system.E = Ebar(system.hand_up_x, system.hand_up_y)

  return system
}


