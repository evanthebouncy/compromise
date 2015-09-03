// there are 3 possible abstractions for our world
// in the world state, everything is concrete
// in the abstract state, the world state is summarized, possibly losing information
// in the constraint state, the abstract state is passed through a constraint

// for the precondition A

// abstract state is of form [deltaX, deltaY] between boxB and boxA
var abstract_state_A = {
  abstraction : function (boxA, boxB) {
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    return [xy.x, xy.y]
  },

  concretize : function(abs_vect) {
    var aX = 50
    var aY = 590
    var boxA = Bodies.rectangle(aX, aY, 50, 50, {restitution: 0.7});
    var bX = abs_vect[0] + aX
    var bY = abs_vect[1] + aY
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}
// a predicate is actually an object with a function to decide of an abstract state
// meets the predicate, and a function to create a sample point in an abstract state
var predicate_A = {
  // params are height_diff and side_diff
  w_diff_range : [75, 600],
  h_diff_range : [50, 400],
  
  sat : function(abs_vect) {
    return in_rng(abs_vect[0], this.w_diff_range) && in_rng(-1*abs_vect[1], this.h_diff_range)
  },

  soft_sat : function(vect) {
    return Math.min (soft_in_rng(abs_vect[0], this.w_diff_range), 
                     soft_in_rng(-1 * abs_vect[1], this.h_diff_range)
                    )
  },

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = -1 * randI(this.h_diff_range[0], this.h_diff_range[1])
    return [diffX, diffY]
  }
}


// for the condition B

// abstract state is of form [deltaX, deltaY, a.y_velocity] between boxB and boxA
var abstract_state_B = {
  abstraction : function(boxA, boxB) {
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    var y_velocity = boxA.velocity.y
    return [xy.x, xy.y, y_velocity]
  },

  concretize : function (state_B_vect) {
    var aX = 50
    var aY = 250
    var boxA = Bodies.rectangle(aX, aY, 50, 50, {restitution: 0.7});
    Body.setVelocity(boxA, {x: 0.0, y: state_B_vect[2]})
    var bX = state_B_vect[0] + aX
    var bY = state_B_vect[1] + aY
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}
var predicate_B = {
  // params are height_diff and side_diff
  w_diff_range : [75, 600],
  // this param is the diff multiplier, 
  // diff bound,
  // and the y_velocity_bounds
  param : [0.3, 10, -3.7, 3.7],
  
  sat : function(state_B_vect) {
    var param = this.param
    var diffX = Math.abs(state_B_vect[0])
    var diffY = param[0] * diffX + 30
    var h_diff_range = [diffY - param[1], diffY + param[1]]
    var velo_y_range = [param[2], param[3]]
    return in_rng(state_B_vect[1], h_diff_range) && 
           in_rng(state_B_vect[2], velo_y_range)
  },

  soft_sat : function(state_B_vect) {
    var param = this.param
    var diffX = Math.abs(state_B_vect[0])
    var diffY = param[0] * diffX + 30
    var h_diff_range = [diffY - param[1], diffY + param[1]]
    var velo_y_range = [param[2], param[3]]
    return Math.min (soft_in_rng(state_B_vect[1], h_diff_range),
                     soft_in_rng(state_B_vect[2], velo_y_range))
  },

  sample : function() {
    var param = this.param
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = param[0] * diffX_mag + 30 + randI(-1*param[1], param[1])
    var veloY = randR(param[2], param[3])
    return [diffX, diffY, veloY]
  }
}


// for the postcondition C

// abstract state is of the form [deltaX, deltaY, a.velocity] 
var abstract_state_C = {
  abstraction : function(boxA, boxB) {
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    var velocity = boxA.velocity
    return [xy.x, xy.y, velocity.x, velocity.y]
  },

  concretize : function(state_C_vect) {
    var boxA = Bodies.rectangle(400, 300, 50, 50, {restitution: 0.7});
    Body.setVelocity(boxA, {x: state_C_vect[2], y: state_C_vect[3]})
    var bX = state_C_vect[0] + 400
    var bY = state_C_vect[1] + 300
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}
var predicate_C = {
  // params are height_diff and side_diff
  w_diff_range : [-24, 24],
  h_diff_range : [50, 52],
  v_diff_range : [-0.1, 0.1],
  
  sat : function(state_C_vect) {
    return in_rng(state_B_vect[0], w_diff_range) && 
           in_rng(state_B_vect[1], h_diff_range) &&
           in_rng(state_B_vect[2], v_diff_range) &&
           in_rng(state_B_vect[3], v_diff_range)
  },

  soft_sat : function(state_C_vect) {
    return Math.min( soft_in_rng(state_B_vect[0], w_diff_range),
                     soft_in_rng(state_B_vect[1], h_diff_range),
                     soft_in_rng(state_B_vect[2], v_diff_range),
                     soft_in_rng(state_B_vect[3], v_diff_range)
            )
  },

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = randI(this.h_diff_range[0], this.h_diff_range[1])
    var veloX = randR(this.v_diff_range[0], this.v_diff_range[1])
    var veloY = randR(this.v_diff_range[0], this.v_diff_range[1])
    return [diffX, diffY, veloX, veloY]
  }
}


