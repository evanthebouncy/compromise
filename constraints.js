// there are 3 possible abstractions for our world
// in the world state, everything is concrete
// in the abstract state, the world state is summarized, possibly losing information
// in the constraint state, the abstract state is passed through a constraint

// for the precondition A

// abstract state is of form [deltaX, deltaY] between boxB and boxA
function abstract_A(boxA, boxB) {
  var xy = Matter.Vector.sub(boxB.position, boxA.position)
  return [xy.x, xy.y]
}

function concretize_A(diff_vect) {
  var boxA = Bodies.rectangle(400, 590, 50, 50, {restitution: 0.7});
  var bX = diff_vect[0] + 400
  var bY = diff_vect[1] + 590
  var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  return [boxA, boxB, ground]
}

// a predicate is actually an object with a function to decide of an abstract state
// meets the predicate, and a function to create a sample point in an abstract state
var predicate_A = {
  // params are height_diff and side_diff
  h_diff_range : [50, 500],
  w_diff_range : [75, 300],
  
  sat : function(vect) {
    var diffX = Math.abs(vect[0])
    var diffY = -1 * vect[1]
    return in_rng(diffX, this.w_diff_range) && in_rng(diffY, this.h_diff_range)
  },

  sample : function() {
    var diffX_mag = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffX_sign = randI(0,100) > 50 ? 1 : -1
    var diffX = diffX_sign * diffX_mag
    var diffY = -1 * randI(this.h_diff_range[0], this.h_diff_range[1])
    return [diffX, diffY]
  }
}


// for the condition B

// abstract state is of form [deltaX, deltaY, a.y_velocity] between boxB and boxA
function abstract_B(boxA, boxB) {
  var xy = Matter.Vector.sub(boxB.position, boxA.position)
  var y_velocity = boxA.velocity.y
  return [xy.x, xy.y, y_velocity]
}

function concretize_B(state_B_vect) {
  var boxA = Bodies.rectangle(400, 50, 50, 50, {restitution: 0.7});
  Body.setVelocity(boxA, {x: 0.0, y: state_B_vect[2]})
  var bX = state_B_vect[0] + 400
  var bY = state_B_vect[1] + 50
  var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  return [boxA, boxB, ground]
}

var predicate_B = {
  // params are height_diff and side_diff
  w_diff_range : [75, 300],
  // this param is the diff multiplier, 
  // diff bound,
  // and the y_velocity_bound
  param : [0.3, 10, 3.7],
  
  sat : function(state_B_vect) {
    var param = this.param
    var diffX = Math.abs(state_B_vect[0])
    var diffY = param[0] * diffX + 30
    var h_diff_range = [diffY - param[1], diffY + param[1]]
    var velo_y_range = [-1 * param[2], param[2]]
    return in_rng(state_B_vect[1], h_diff_range) && 
           in_rng(state_B_vect[2], velo_y_range)
  },

  sample : function() {
    var param = this.param
    var diffX_mag = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffX_sign = randI(0,100) > 50 ? 1 : -1
    var diffX = diffX_sign * diffX_mag
    var diffY = param[0] * diffX_mag + 30 + randI(-1*param[1], param[1])
    var veloY = randR(-1*param[2], param[2])
    return [diffX, diffY, veloY]
  }
}


// for the postcondition C

// abstract state is of the form [deltaX, deltaY, a.velocity] 
function abstract_C(boxA, boxB) {
  var xy = Matter.Vector.sub(boxB.position, boxA.position)
  var velocity = boxA.velocity
  return [xy.x, xy.y, velocity.x, velocity.y]
}

function concretize_C(state_C_vect) {
  var boxA = Bodies.rectangle(400, 300, 50, 50, {restitution: 0.7});
  Body.setVelocity(boxA, {x: state_C_vect[2], y: state_C_vect[3]})
  var bX = state_C_vect[0] + 400
  var bY = state_C_vect[1] + 300
  var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
  return [boxA, boxB, ground]
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

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = randI(this.h_diff_range[0], this.h_diff_range[1])
    var veloX = randR(this.v_diff_range[0], this.v_diff_range[1])
    var veloY = randR(this.v_diff_range[0], this.v_diff_range[1])
    return [diffX, diffY, veloX, veloY]
  }
}


